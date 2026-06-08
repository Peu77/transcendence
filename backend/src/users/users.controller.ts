import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Res,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { createReadStream } from 'node:fs'
import { Response } from 'express'
import * as speakeasy from 'speakeasy'
import { UsersService } from './users.service'
import { AuthGuard, UserId } from '../auth/auth.guard'
import {
  ProfilePictureDto,
  UpdateGameControlsDto,
  UpdateTetrisHandlingSettingsDto,
  VerifyTwoFaDto,
} from './dto'
import { v4 as uuid } from 'uuid'

@Controller()
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users/me')
  async getMe(@UserId() userId: string) {
    const user = await this.usersService.getUserByid(userId)
    return {
      id: user.id,
      email: user.email,
      profilePictureId: user.profilePictureId,
      twoFaEnabled: user.twoFaEnabled,
      username: user.username,
      theme: user.theme,
      gameControls: this.usersService.normalizeGameControls(user.gameControls),
      tetrisHandlingSettings: this.usersService.normalizeTetrisHandlingSettings(
        user.tetrisHandlingSettings,
      ),
    }
  }

  @Get('users/me/history')
  async getMatchHistory(@UserId() userId: string) {
    return this.usersService.getMatchHistory(userId)
  }

  @Get('users/ranking')
  async getGlobalRanking() {
    return this.usersService.getGlobalRanking()
  }

  @Post('users/gameControls')
  async updateGameControls(
    @UserId() userId: string,
    @Body() body: UpdateGameControlsDto,
  ) {
    const gameControls = await this.usersService.updateGameControls(
      userId,
      body.controls,
    )
    return { gameControls }
  }

  @Post('users/tetrisHandlingSettings')
  async updateTetrisHandlingSettings(
    @UserId() userId: string,
    @Body() body: UpdateTetrisHandlingSettingsDto,
  ) {
    const tetrisHandlingSettings =
      await this.usersService.updateTetrisHandlingSettings(
        userId,
        body.settings,
      )
    return { tetrisHandlingSettings }
  }

  @Post('users/profilePicture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: async (_req, _file, cb) => {
          await fs.mkdir(UsersService.UPLOAD_DIR, { recursive: true })
          cb(null, UsersService.UPLOAD_DIR)
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype && !file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException(
              'Invalid file type. Only images are allowed',
            ),
            false,
          )
        }
        cb(null, true)
      },
    }),
  )
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @UserId() userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded')
    }
    const user = await this.usersService.getUserByid(userId)

    if (
      user.profilePictureId &&
      (await this.usersService.existUserProfilePictureInFs(
        user.profilePictureId,
      ))
    ) {
      await fs.unlink(path.join(UsersService.UPLOAD_DIR, user.profilePictureId))
    }

    const newFileId = uuid()
    await fs.rename(file.path, path.join(UsersService.UPLOAD_DIR, newFileId))
    console.log(`Profile picture uploaded with ID: ${newFileId}`)

    await this.usersService.updateProfilePictureId(user.id, newFileId)
    return {
      message: 'Profile picture uploaded successfully',
      profilePictureId: newFileId,
    }
  }

  @Get('users/profilePicture/:id')
  async getProfilePicture(
    @Param() params: ProfilePictureDto,
    @Res() res: Response,
  ) {
    const filepath = path.join(UsersService.UPLOAD_DIR, params.id)
    try {
      await fs.access(filepath)
    } catch {
      throw new BadRequestException('Profile picture not found')
    }

    res.setHeader('Cache-Control', 'public, max-age=600')
    const stream = createReadStream(filepath)
    stream.pipe(res)
  }

  @Get('users/profile/:id')
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id)
  }

  @Post('users/toggleTheme')
  async toggleTheme(@UserId() userId: string) {
    const theme = await this.usersService.toggleTheme(userId)
    return { theme }
  }

  @Post('users/2fa/generate')
  async generateTwoFaSecret(@UserId() userId: string) {
    const user = await this.usersService.getUserByid(userId)
    if (user.twoFaEnabled) {
      throw new BadRequestException('2FA is already enabled')
    }

    const secret = speakeasy.generateSecret({
      name: `Transcendence (${user.email})`,
    })

    await this.usersService.updateTwoFaSecret(userId, secret.base32)

    return {
      otpauthUrl: secret.otpauth_url,
      base32: secret.base32,
    }
  }

  @Post('users/2fa/enable')
  async enableTwoFa(@UserId() userId: string, @Body() body: VerifyTwoFaDto) {
    const user = await this.usersService.getUserByid(userId)
    if (user.twoFaEnabled) {
      throw new BadRequestException('2FA is already enabled')
    }
    if (!user.twoFaSecret) {
      throw new BadRequestException('2FA secret not generated')
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token: body.code,
    })

    if (!verified) {
      throw new BadRequestException('Invalid OTP code')
    }

    await this.usersService.enableTwoFa(userId)
    return { message: '2FA enabled successfully' }
  }

  @Post('users/2fa/disable')
  async disableTwoFa(@UserId() userId: string, @Body() body: VerifyTwoFaDto) {
    const user = await this.usersService.getUserByid(userId)
    if (!user.twoFaEnabled) {
      throw new BadRequestException('2FA is not enabled')
    }
    if (!user.twoFaSecret) {
      throw new BadRequestException('2FA secret not found')
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token: body.code,
    })

    if (!verified) {
      throw new BadRequestException('Invalid OTP code')
    }

    await this.usersService.disableTwoFa(userId)
    return { message: '2FA disabled successfully' }
  }
}
