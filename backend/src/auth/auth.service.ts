import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { User } from '../users/user.entity';
import { TwoFa } from './twofa.entity';
import * as jwt from "jsonwebtoken";
import * as speakeasy from 'speakeasy';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(TwoFa) private readonly twoFaRepo: Repository<TwoFa>,
    configService: ConfigService,
  ) {
    this.jwtSecret = configService.getOrThrow<string>('JWT_SECRET');
  }

  createUserToken(userId: string): string {
    return jwt.sign({ userId },   this.jwtSecret,  {
      expiresIn: '7d',
    });
  }

  async create2FaSession(userId: string): Promise<{ twoFaId: string; twoFaSecret: string }> {
    const twoFaId = randomUUID();
    const secret = randomUUID().replace(/-/g, '').slice(0, 20).toUpperCase();
    const twoFaSecret = Buffer.from(secret).toString('base64').replace(/=/g, '');
    const IN_FIVE_MINUTES = 5 * 60 * 1000;
    const expiredAt = new Date(Date.now() + IN_FIVE_MINUTES);

    const session = this.twoFaRepo.create({
      id: twoFaId,
      userId,
      secret: twoFaSecret,
      expiredAt,
    });
    await this.twoFaRepo.save(session);
    return { twoFaId, twoFaSecret };
  }

  async delete2FaSession(twoFaId: string): Promise<void> {
    await this.twoFaRepo.delete({ id: twoFaId });
  }

  async isValidTwoFaToken(twoFaSecret: string, twoFaId: string, userId: string, token: string): Promise<boolean> {
    const result = await this.twoFaRepo.findOne({ where: { id: twoFaId, secret: twoFaSecret, userId } });
    if (!result) return false;

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (
      !user?.twoFaEnabled ||
      !user.twoFaSecret ||
      result.expiredAt < new Date()
    ) {
      await this.delete2FaSession(twoFaId);
      return false;
    }

    const secret = Buffer.from(user.twoFaSecret, 'base64').toString('ascii');
    return speakeasy.totp.verify({ secret, encoding: 'ascii', token, window: 1 });

  }
}
