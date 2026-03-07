import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { Request, Response } from 'express'
import * as bcrypt from 'bcryptjs'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { LoginDto, RegisterDto, TwoFAVerifyDto } from './dto'
import { GithubAuthGuard } from './github-auth.guard'
import { UserType } from '../users/user.entity'
import { GithubValidateReturn } from './github.strategy'
import { ConfigService } from '@nestjs/config'

@Controller('auth')
export class AuthController {
  private readonly frontendSuccessLoginUrl: string

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.frontendSuccessLoginUrl = this.configService.getOrThrow<string>(
      'FRONTEND_SUCCESS_LOGIN_URL',
    )
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const email = dto.email.toLowerCase()
    const passwordHash = await bcrypt.hash(dto.password, 10)
    let userId: string

    try {
      const createdUser = await this.usersService.createUser(
        UserType.EMAIL,
        email,
        dto.username,
        passwordHash,
        null,
        null,
      )
      userId = createdUser.id
    } catch {
      return res
        .status(HttpStatus.CONFLICT)
        .send({ message: 'Email already registered' })
    }

    const token = this.authService.createUserToken(userId)
    res.cookie('token', token, { httpOnly: true, path: '/' })
    res.status(HttpStatus.CREATED).send({})
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const email = dto.email.toLowerCase()
    const user = await this.usersService.findByEmail(email)
    if (!user || !user.password || user.userType !== UserType.EMAIL) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ error: 'Invalid credentials' })
    }

    if (!(await bcrypt.compare(dto.password, user.password)))
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ error: 'Invalid credentials' })

    if (!user.twoFaEnabled) {
      const token = this.authService.createUserToken(user.id)
      res.cookie('token', token, { httpOnly: true, path: '/' })
      return res.send({})
    }

    const twoFaSession = await this.authService.create2FaSession(user.id)
    return res.send({ requires2FA: true, twoFaSession, userId: user.id })
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  async githubLogin() {}

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const oauthUser = req.user as GithubValidateReturn
    if (!oauthUser.githubId) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ error: 'GitHub authentication failed' })
    }

    const user = await this.usersService.upsertGithubUser(oauthUser)

    const token = this.authService.createUserToken(user.id)
    res.cookie('token', token, { httpOnly: true, path: '/' })
    return res.redirect(this.frontendSuccessLoginUrl)
  }

  @Post('2fa/verify')
  async verify2Fa(@Body() dto: TwoFAVerifyDto, @Res() res: Response) {
    const valid = await this.authService.isValidTwoFaToken(
      dto.twoFaSessionId,
      dto.userId,
      dto.token,
    )

    if (!valid) throw new BadRequestException('Invalid 2FA token')

    const token = this.authService.createUserToken(dto.userId)
    res.cookie('token', token, { httpOnly: true, path: '/' })
    return res.send({ token })
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', { path: '/' })
    return {}
  }
}
