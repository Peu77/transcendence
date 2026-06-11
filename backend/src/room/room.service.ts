import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  GarbageCancel,
  MatchSettings,
  PieceRandomizer,
  Room,
  RoomType,
  RotationSystem,
} from './types'
import { RealtimeService } from '../realtime/realtime.service'
import { UsersService } from '../users/users.service'
import { gameRoom } from '../realtime/realtime.constants'

@Injectable()
export class RoomService {
  private readonly rooms: Map<string, Room> = new Map()

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly usersService: UsersService,
  ) {}

  async joinRoom(roomId: string, userId: string): Promise<void> {
    const room = this.rooms.get(roomId)
    if (!room) {
      throw new NotFoundException('Room not found')
    }

    const existingUser = room.users.find((u) => u.id === userId)
    if (existingUser) {
      return
    }

    const userInfo = await this.usersService.getUserInfo(userId)
    room.users.push({
      id: userId,
      username: userInfo.username,
      profilePictureId: userInfo.profilePictureId,
    })

    this.sendUpdateRoomEvent(roomId)
    this.realtimeService.emitRoomsUpdated()
  }

  getRoom(roomId: string): Room {
    const room = this.rooms.get(roomId)
    if (!room) throw new NotFoundException('Room not found')

    return room
  }

  leaveRoom(roomId: string, userId: string) {
    const room = this.rooms.get(roomId)
    if (!room) return

    const userInRoom = room.users.find((u) => u.id === userId)
    if (!userInRoom) return

    room.users = room.users.filter((u) => u.id !== userId)

    if (room.users.length === 0) {
      this.deleteRoom(roomId)
      this.realtimeService.emitRoomsUpdated()
      return
    }

    if (room.hostUserId === userId) {
      const nextHost = room.users[0]
      room.hostUserId = nextHost.id
    }

    this.sendUpdateRoomEvent(roomId)
    this.realtimeService.emitRoomsUpdated()
  }

  leaveAllRooms(userId: string) {
    for (const room of this.rooms.values()) {
      this.leaveRoom(room.id, userId)
    }
  }

  createNewRoom(userId: string): Room {
    const room: Room = {
      id: this.generateFreeRoomId(),
      type: RoomType.PUBLIC,
      status: 'waiting',
      hostUserId: userId,
      settings: this.createDefaultMatchSettings(),
      users: [],
    }
    this.rooms.set(room.id, room)
    this.realtimeService.emitRoomsUpdated()
    return room
  }

  startGame(roomId: string, userId: string): Room {
    const room = this.rooms.get(roomId)
    if (!room) throw new NotFoundException('Room not found')

    if (room.hostUserId !== userId)
      throw new BadRequestException('Only the host can start the game')

    if (room.status === 'playing')
      throw new BadRequestException('Game is already in progress')

    room.status = 'playing'
    return room
  }

  endGame(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.status = 'waiting'
    this.sendUpdateRoomEvent(roomId)
    this.realtimeService.emitRoomsUpdated()
  }

  getPublicRooms(): Promise<Room[]> {
    return Promise.resolve(
      Array.from(this.rooms.values()).filter(
        (room) => room.type === RoomType.PUBLIC,
      ),
    )
  }

  deleteRoom(roomId: string) {
    this.rooms.delete(roomId)
  }

  updateRoomSettings(
    roomId: string,
    userId: string,
    update: Partial<Room>,
  ): Room {
    const room = this.rooms.get(roomId)
    if (!room) throw new NotFoundException('Room not found')

    if (room.hostUserId !== userId)
      throw new BadRequestException('Only the host can update room settings')

    if (update.type) {
      room.type = update.type
    }

    this.sendUpdateRoomEvent(roomId)
    this.realtimeService.emitRoomsUpdated()
    return room
  }

  updateMatchSettings(
    roomId: string,
    userId: string,
    settings: MatchSettings,
  ): Room {
    const room = this.rooms.get(roomId)
    if (!room) throw new NotFoundException('Room not found')

    if (room.hostUserId !== userId)
      throw new BadRequestException('Only the host can update match settings')

    room.settings = { ...settings }

    this.sendUpdateRoomEvent(roomId)
    return room
  }

  sendUpdateRoomEvent(roomId: string) {
    this.realtimeService.emitToRoom(gameRoom(roomId), 'room.updated', {})
  }

  createDefaultMatchSettings(): MatchSettings {
    return {
      gravity: 0.02,
      gincrease: 0.0025,
      gmargin: 3600,
      lockDelayMs: 500,
      lockResetLimit: 15,
      areMs: 0,
      lineClearDelayMs: 500,
      rotationSystem: RotationSystem.SRS,
      hold: true,
      nextCount: 5,
      bag: PieceRandomizer.SEVEN_BAG,
      forbidInitialSZ: false,
      width: 10,
      height: 20,
      hiddenRows: 0,
      garbageTargetK: 5,
      garbage: {
        enabled: true,
        delayMs: 1000,
        cancel: GarbageCancel.PARTIAL,
        holeCount: 1,
        messiness: 0.42,
      },
      damage: {
        table: {
          single: 0,
          double: 1,
          triple: 2,
          tetris: 4,
          tSpinMiniSingle: 0,
          tSpinMiniDouble: 1,
          tSpinSingle: 2,
          tSpinDouble: 4,
          tSpinTriple: 6,
          allClear: 10,
        },
        comboTable: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4],
        backToBackBonus: 1,
        garbageCap: 8,
      },
    }
  }

  generateFreeRoomId(): string {
    let newRoomId = this.generateRoomId()
    while (this.rooms.has(newRoomId)) {
      newRoomId = this.generateRoomId()
    }
    return newRoomId
  }

  generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

    let id = ''
    for (let i = 0; i < 5; i++) {
      id += chars[Math.floor(Math.random() * chars.length)]
    }
    return id
  }
}
