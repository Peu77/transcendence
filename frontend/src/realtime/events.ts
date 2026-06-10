import type { DirectMessage, PresenceStatus } from '@/api/friends'
import type { TetrisState, TetrominoType } from '@transcendence/shared'

export type UserInfo = {
  username: string
  profilePictureId: string | null
}

export interface FriendRequestCreatedEvent {
  senderInfo: UserInfo
  requestId: string
  senderId: string
  toUser: { id: string }
  createdAt: string
}

export type FriendRequestResolvedEvent = {
  requestId: string
  fromUserId: string
  toUserId: string
  resolvedAt: string
}

export type FriendshipDeletedEvent = {
  userId: string
  friendUserId: string
  deletedAt: string
}

export type PresenceUpdatedEvent = {
  userId: string
  status: PresenceStatus
  lastSeenAt: string | null
  updatedAt: string
}

export type DirectMessageCreatedEvent = DirectMessage & {
  senderInfo: UserInfo
}

export type RoomChatMessageEvent = {
  id: string
  roomId: string
  senderId: string
  senderInfo: UserInfo
  content: string
  createdAt: string
}

export type GamePlayerResult = {
  userId: string
  username: string
  score: number
  lines: number
  level: number
}

export type LiveEventMap = {
  ready: { userId: string }
  'room.updated': Record<string, never>
  'room.chat.message': RoomChatMessageEvent
  'friend_request.created': FriendRequestCreatedEvent
  'friend_request.accepted': FriendRequestResolvedEvent
  'friend_request.denied': FriendRequestResolvedEvent
  'friend_request.canceled': FriendRequestResolvedEvent
  'friendship.deleted': FriendshipDeletedEvent
  'presence.updated': PresenceUpdatedEvent
  'dm.created': DirectMessageCreatedEvent
  'game.countdown': { roomId: string; count: number }
  'game.state': {
    roomId: string
    players: Record<string, TetrisState>
    lastSeq?: Record<string, number>
    predictionPieces?: Record<string, TetrominoType[]>
  }
  'game.player-over': {
    roomId: string
    userId: string
    score: number
    lines: number
    level: number
  }
  'game.finished': { roomId: string; results: GamePlayerResult[] }
}
