import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../users/user.entity'
import { TwoFa } from './twofa.entity'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'
import { UsersModule } from '../users/users.module'
import { PassportModule } from '@nestjs/passport'
import { GithubStrategy } from './github.strategy'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TwoFa]),
    UsersModule,
    PassportModule,
  ],
  providers: [AuthService, AuthGuard, GithubStrategy],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
