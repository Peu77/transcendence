import { axios } from '@/lib/client.ts'
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

export async function getRooms(): Promise<Room[]> {
  const response = await axios.get<Room[]>(`/room`)
  return response.data
}

export async function createRoom(): Promise<Room> {
  const response = await axios.post<Room>('/room')
  return response.data
}

export async function getRoom(roomId: string): Promise<Room> {
  const response = await axios.get<Room>(`/room/${roomId}`)
  return response.data
}

export async function updateMatchSettings(
  roomId: string,
  settings: MatchSettings,
): Promise<Room> {
  const response = await axios.patch<Room>(
    `/room/${roomId}/settings/match`,
    settings,
  )
  return response.data
}

export async function updateRoomSettings(
  roomId: string,
  update: { type: RoomType },
): Promise<Room> {
  const response = await axios.patch<Room>(
    `/room/${roomId}/settings/room`,
    update,
  )
  return response.data
}
