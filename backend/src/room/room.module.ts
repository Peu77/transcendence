import { forwardRef, Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { RealtimeModule } from "../realtime/realtime.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [forwardRef(() => RealtimeModule), UsersModule],
  providers: [RoomService],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}
