import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './user.entity'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { MatchResult } from './match-result.entity'
import { UserStats } from '../stats/user-stats.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User, MatchResult, UserStats])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
