import { Injectable } from "@nestjs/common";
import {
  MatchSettings,
  PieceRandomizer,
  Room,
  RoomType,
  RotationSystem,
} from "./types";

@Injectable()
export class RoomService {
  private readonly rooms: Map<string, Room> = new Map();

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
