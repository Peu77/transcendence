import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RealtimeGateway } from './realtime.gateway'
import { RealtimeService } from './realtime.service'
import { RealtimePresenceService } from './realtime-presence.service'
import { UserPresence } from '../friends/entities/user-presence.entity'
import { Friendship } from '../friends/entities/friendship.entity'
import { RoomModule } from '../room/room.module'
import { MatchResult } from '../users/match-result.entity'
import { StatsModule } from '../stats/stats.module'
import { AchievementsModule } from '../achievements/achievements.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPresence, Friendship, MatchResult]),
    forwardRef(() => RoomModule),
    StatsModule,
    AchievementsModule,
  ],
  providers: [RealtimeGateway, RealtimeService, RealtimePresenceService],
  exports: [RealtimeService, RealtimePresenceService],
})
export class RealtimeModule {}
