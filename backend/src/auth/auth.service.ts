import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { randomUUID } from 'node:crypto'
import { User } from '../users/user.entity'
import { TwoFa } from './twofa.entity'
import * as jwt from 'jsonwebtoken'
import * as speakeasy from 'speakeasy'

@Injectable()
export class AuthService {
  private readonly jwtSecret: string

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(TwoFa) private readonly twoFaRepo: Repository<TwoFa>,
    configService: ConfigService,
  ) {
    this.jwtSecret = configService.getOrThrow<string>('JWT_SECRET')
  }

  createUserToken(userId: string): string {
    return jwt.sign({ userId }, this.jwtSecret, {
      expiresIn: '7d',
    })
  }

  async create2FaSession(userId: string): Promise<{ twoFaSessionId: string }> {
    const twoFaSessionId = randomUUID()
    const secret = randomUUID().replace(/-/g, '').slice(0, 20).toUpperCase()
    const twoFaSecret = Buffer.from(secret).toString('base64').replace(/=/g, '')
    const IN_FIVE_MINUTES = 5 * 60 * 1000
    const expiredAt = new Date(Date.now() + IN_FIVE_MINUTES)

    const session = this.twoFaRepo.create({
      id: twoFaSessionId,
      userId,
      secret: twoFaSecret,
      expiredAt,
    })
    await this.twoFaRepo.save(session)
    return { twoFaSessionId }
  }

  async delete2FaSession(twoFaSessionId: string): Promise<void> {
    await this.twoFaRepo.delete({ id: twoFaSessionId })
  }

  async isValidTwoFaToken(
    twoFaSessionId: string,
    userId: string,
    token: string,
  ): Promise<boolean> {
    const session = await this.twoFaRepo.findOne({
      where: { id: twoFaSessionId, userId },
    })
    if (!session) return false

    if (session.expiredAt < new Date()) {
      await this.delete2FaSession(twoFaSessionId)
      return false
    }

    if (session.lastAttemptAt) {
      const waitTime = Math.pow(2, session.failedAttempts) * 1000 // Exponential backoff in ms
      const nextAllowedAttempt = new Date(
        session.lastAttemptAt.getTime() + waitTime,
      )
      if (new Date() < nextAllowedAttempt) {
        throw new BadRequestException(
          `Too many attempts. Please wait ${Math.ceil((nextAllowedAttempt.getTime() - Date.now()) / 1000)} seconds.`,
        )
      }
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user?.twoFaEnabled || !user.twoFaSecret) {
      await this.delete2FaSession(twoFaSessionId)
      return false
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token,
    })

    if (!isValid) {
      session.failedAttempts += 1
      session.lastAttemptAt = new Date()
      await this.twoFaRepo.save(session)
      return false
    }

    await this.delete2FaSession(twoFaSessionId)
    return true
  }
}
