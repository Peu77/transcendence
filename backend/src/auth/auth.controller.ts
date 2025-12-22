import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from "@nestjs/common";
import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, TwoFAVerifyDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const email = dto.email.toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, 10);
    let userId: string

    try {
      const createdUser = await this.usersService.createUser(email, passwordHash);
      userId = createdUser.id;

    } catch {
      return res
        .status(HttpStatus.CONFLICT)
        .send({ message: 'Email already registered' });
    }

    const token = this.authService.createUserToken(userId);
    res.cookie('token', token, { httpOnly: true, path: '/' });
    res.status(HttpStatus.CREATED).send({});
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const email = dto.email.toLowerCase();
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ error: 'Invalid credentials' });
    }

    if (!(await bcrypt.compare(dto.password, user.password)))
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ error: "Invalid credentials" });


    if (!user.twoFaEnabled) {
      const token = this.authService.createUserToken(user.id);
      res.cookie('token', token, { httpOnly: true, path: '/' });
      return res.send({});
    }

    const twoFaSession = await this.authService.create2FaSession(user.id);
    return res.send({ requires2FA: true, twoFaSession });
  }

  @Post('2fa/verify')
  async verify2Fa(@Body() dto: TwoFAVerifyDto) {
    const valid = await this.authService.isValidTwoFaToken(
      dto.twoFaSecret,
      dto.twoFaId,
      dto.userId,
      dto.token,
    );

    if (!valid)
      throw new BadRequestException('Invalid 2FA token');

    return { token: this.authService.createUserToken(dto.userId) };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', { path: '/' });
    return {};
  }
}
