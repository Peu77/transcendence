import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { RoomService } from "./room.service";
import { AuthGuard, UserId } from "../auth/auth.guard";
import { Room } from "./types";

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
}
