import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RoomService } from "./room.service";
import { AuthGuard, UserId } from "../auth/auth.guard";
import { Room } from "./types";
import { UpdateMatchSettingsDto, UpdateRoomSettingsDto } from "./dto";

@UseGuards(AuthGuard)
@Controller("room")
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  getPublicRooms(): Promise<Room[]> {
    return this.roomService.getPublicRooms();
  }

  @Post()
  createRoom(@UserId() userId: string) {
    return this.roomService.createNewRoom(userId);
  }

  @Get(":roomId")
  getRoom(@Param("roomId") roomId: string) {
    return this.roomService.getRoom(roomId);
  }

  @Patch(":roomId/settings/match")
  updateMatchSettings(
    @Param("roomId") roomId: string,
    @UserId() userId: string,
    @Body() settings: UpdateMatchSettingsDto,
  ) {
    return this.roomService.updateMatchSettings(roomId, userId, settings);
  }

  @Patch(":roomId/settings/room")
  updateRoomSettings(
    @Param("roomId") roomId: string,
    @UserId() userId: string,
    @Body() update: UpdateRoomSettingsDto,
  ) {
    return this.roomService.updateRoomSettings(roomId, userId, update);
  }
}
