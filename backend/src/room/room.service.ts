import { Injectable } from "@nestjs/common";
import {
  MatchSettings,
  PieceRandomizer,
  Room,
  RoomType,
  RotationSystem,
} from "./types";
import { RealtimeService } from "../realtime/realtime.service";
import { UsersService } from "../users/users.service";
import { Socket } from "socket.io";

@Injectable()
export class RoomService {
  private readonly rooms: Map<string, Room> = new Map();

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly usersService: UsersService,
  ) {
  }

  async joinRoom(roomId: string, userId: string, socket: Socket): Promise<Room> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const existingUser = room.users.find((u) => u.id === userId);
    if (existingUser) {
      // Reconnection logic
      existingUser.ws = socket;
    } else {
      const userInfo = await this.usersService.getUserInfo(userId);
      room.users.push({
        id: userId,
        username: userInfo.username,
        profilePictureId: userInfo.profilePictureId,
        ws: socket,
      });
    }

    return room;
  }

  leaveRoom(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.users = room.users.filter((u) => u.id !== userId);

    if (room.users.length === 0 && room.type !== RoomType.SYSTEM) {
      this.deleteRoom(roomId);
    }
  }

  leaveAllRooms(userId: string) {
    for (const room of this.rooms.values()) {
      this.leaveRoom(room.id, userId);
    }
  }

  createNewRoom(userId: string): Room {
    const room: Room = {
      id: this.generateFreeRoomId(),
      type: RoomType.PRIVATE,
      hostUserId: userId,
      settings: this.createDefaultMatchSettings(),
      users: [],
    };
    this.rooms.set(room.id, room);
    return room;
  }

  getPublicRooms(): Promise<Room[]> {
    return Promise.resolve(
      Array.from(this.rooms.values()).filter(
        (room) => room.type === RoomType.PUBLIC,
      ),
    );
  }

  deleteRoom(roomId: string) {
    this.rooms.delete(roomId);
  }

  createDefaultMatchSettings(): MatchSettings {
    return {
      gravity: 1,
      lockDelayMs: 1000,
      lockResetLimit: 4,
      areMs: 0,
      lineClearDelayMs: 500,
      rotationSystem: RotationSystem.SRS,
      hold: true,
      nextCount: 3,
      bag: PieceRandomizer.SEVEN_BAG,
      forbidInitialSZ: false,
      width: 10,
      height: 20,
      hiddenRows: 0,
      garbage: {
        enabled: true,
        delayMs: 1000,
        cancel: "partial",
        holeCount: 1,
        messiness: 0.42,
      },
      damage: {
        table: {
          single: 1,
          double: 2,
          triple: 3,
          tetris: 4,
          tSpinSingle: 2,
          tSpinDouble: 4,
          tSpinTriple: 6,
        },
        comboMultiplier: 1.5,
        backToBackMultiplier: 1.5,
      },
    };
  }

  generateFreeRoomId(): string {
    let newRoomId = this.generateRoomId();
    while (this.rooms.has(newRoomId)) {
      newRoomId = this.generateRoomId();
    }
    return newRoomId;
  }

  generateRoomId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let id = "";
    for (let i = 0; i < 5; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }
}
