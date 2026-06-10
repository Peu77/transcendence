import { PresenceStatus } from '../friends/entities/user-presence.entity'

export type LiveEventName =
  | 'ready'
  | 'friend_request.created'
  | 'friend_request.accepted'
  | 'friend_request.denied'
  | 'friend_request.canceled'
  | 'friendship.deleted'
  | 'presence.updated'
  | 'dm.created'
  | 'user.blocked'
  | 'rooms.updated'

export interface UserBlockedEvent {
  blockerId: string
}

export interface UserInfo {
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

export interface FriendRequestResolvedEvent {
  requestId: string
  fromUserId: string
  toUserId: string
  resolvedAt: string
}

export interface FriendshipDeletedEvent {
  userId: string
  friendUserId: string
  deletedAt: string
}

export interface PresenceUpdatedEvent {
  userId: string
  status: PresenceStatus
  lastSeenAt: string | null
  updatedAt: string
}

export interface DirectMessageCreatedEvent {
  senderInfo: UserInfo
  id: string
  senderId: string
  recipientId: string
  content: string
  createdAt: string
}
