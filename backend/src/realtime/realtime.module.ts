import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeService } from "./realtime.service";
import { RealtimePresenceService } from "./realtime-presence.service";
import { UserPresence } from "../friends/entities/user-presence.entity";
import { Friendship } from "../friends/entities/friendship.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserPresence, Friendship])],
  providers: [RealtimeGateway, RealtimeService, RealtimePresenceService],
  exports: [RealtimeService, RealtimePresenceService],
})
export class RealtimeModule {}
