import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../users/user.entity'
import { FriendsController } from './friends.controller'
import { FriendsService } from './friends.service'
import { FriendRequest } from './entities/friend-request.entity'
import { Friendship } from './entities/friendship.entity'
import { DirectMessage } from './entities/direct-message.entity'
import { UserPresence } from './entities/user-presence.entity'
import { UserBlock } from './entities/block.entity'
import { RealtimeModule } from '../realtime/realtime.module'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      FriendRequest,
      Friendship,
      DirectMessage,
      UserPresence,
      UserBlock,
    ]),
    RealtimeModule,
    UsersModule,
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
