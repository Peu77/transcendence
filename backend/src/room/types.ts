import type { MatchSettings } from '@transcendence/shared'
export {
  RotationSystem,
  GarbageCancel,
  PieceRandomizer,
  type MatchSettings,
} from '@transcendence/shared'

export interface RoomUser {
  id: string
  username: string
  profilePictureId: string | null
}

export enum RoomType {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
  SYSTEM = 'SYSTEM',
}

export interface Room {
  id: string
  type: RoomType
  status: 'waiting' | 'playing' | 'finished'
  settings: MatchSettings
  hostUserId: string
  users: RoomUser[]
}
