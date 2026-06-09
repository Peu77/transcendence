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

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
}

@Controller('auth')
export class AuthController {
  private readonly frontendSuccessLoginUrl: string
  private readonly frontend2FaUrl: string

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.frontendSuccessLoginUrl = this.configService.getOrThrow<string>(
      'FRONTEND_SUCCESS_LOGIN_URL',
    )
    this.frontend2FaUrl =
      this.configService.getOrThrow<string>('FRONTEND_2FA_URL')
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const email = dto.email.toLowerCase()
    const passwordHash = await bcrypt.hash(dto.password, 10)

    if (await this.usersService.existsByUsername(dto.username))
      return res.status(HttpStatus.CONFLICT).send({
        message: 'Username already registered',
        fieldAlreadyExists: 'username',
      })

    if (await this.usersService.existsByEmail(email))
      return res.status(HttpStatus.CONFLICT).send({
        message: 'Email already registered',
        fieldAlreadyExists: 'email',
      })

    const createdUser = await this.usersService.createUser(
      UserType.EMAIL,
      email,
      dto.username,
      passwordHash,
      null,
      null,
    )

    const token = this.authService.createUserToken(createdUser.id)
    res.cookie('token', token, COOKIE_OPTIONS)
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
      res.cookie('token', token, COOKIE_OPTIONS)
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

    if (user.twoFaEnabled) {
      const { twoFaSessionId } = await this.authService.create2FaSession(
        user.id,
      )
      const url = new URL(this.frontend2FaUrl)
      url.searchParams.set('twoFaSessionId', twoFaSessionId)
      url.searchParams.set('userId', user.id)
      return res.redirect(url.toString())
    }

    const token = this.authService.createUserToken(user.id)
    res.cookie('token', token, COOKIE_OPTIONS)
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
    res.cookie('token', token, COOKIE_OPTIONS)
    return res.send({ token })
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', COOKIE_OPTIONS)
    return {}
  }
}
