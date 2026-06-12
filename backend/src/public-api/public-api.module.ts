import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApiKey } from './api-key.entity'
import { PublicApiController } from './public-api.controller'
import { PublicApiGuard } from './public-api.guard'
import { PublicApiService } from './public-api.service'
import { User } from '../users/user.entity'
import { MatchResult } from '../users/match-result.entity'
import { Friendship } from '../friends/entities/friendship.entity'
import { UsersModule } from '../users/users.module'
import { FriendsModule } from '../friends/friends.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey, User, MatchResult, Friendship]),
    UsersModule,
    FriendsModule,
  ],
  controllers: [PublicApiController],
  providers: [PublicApiService, PublicApiGuard],
})
export class PublicApiModule {}
