import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './user.entity'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { MatchResult } from './match-result.entity'
import { UserBlock } from '../friends/entities/user-block.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User, MatchResult, UserBlock])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
