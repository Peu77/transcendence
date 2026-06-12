import { Injectable } from '@nestjs/common'
import { Server } from 'socket.io'
import { dmRoom, userRoom } from './realtime.constants'
import {
  DirectMessageCreatedEvent,
  DmSeenEvent,
  FriendRequestCreatedEvent,
  FriendRequestResolvedEvent,
  FriendshipDeletedEvent,
  PresenceUpdatedEvent,
  UserBlockedEvent,
} from './realtime.events'

@Injectable()
export class RealtimeService {
  private server: Server | null = null

  setServer(server: Server) {
    this.server = server
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    if (!this.server) return
    this.server.to(userRoom(userId)).emit(event, payload)
  }

  emitToRoom(room: string, event: string, payload: unknown) {
    if (!this.server) return
    this.server.to(room).emit(event, payload)
  }

  emitFriendRequestCreated(
    toUserId: string,
    payload: FriendRequestCreatedEvent,
  ) {
    this.emitToUser(toUserId, 'friend_request.created', payload)
  }

  emitFriendRequestAccepted(
    toUserId: string,
    payload: FriendRequestResolvedEvent,
  ) {
    this.emitToUser(toUserId, 'friend_request.accepted', payload)
  }

  emitFriendRequestDenied(
    toUserId: string,
    payload: FriendRequestResolvedEvent,
  ) {
    this.emitToUser(toUserId, 'friend_request.denied', payload)
  }

  emitFriendRequestCanceled(
    toUserId: string,
    payload: FriendRequestResolvedEvent,
  ) {
    this.emitToUser(toUserId, 'friend_request.canceled', payload)
  }

  emitFriendshipDeleted(
    userIds: [string, string],
    payload: FriendshipDeletedEvent,
  ) {
    if (!this.server) return
    const [a, b] = userIds
    this.server
      .to(userRoom(a))
      .to(userRoom(b))
      .emit('friendship.deleted', payload)
  }

  emitPresenceUpdated(friendIds: string[], payload: PresenceUpdatedEvent) {
    if (!this.server) return
    let broadcast = this.server as any
    for (const id of friendIds) {
      broadcast = broadcast.to(userRoom(id))
    }
    broadcast.emit('presence.updated', payload)
  }

  emitUserBlocked(blockedUserId: string, payload: UserBlockedEvent) {
    this.emitToUser(blockedUserId, 'user.blocked', payload)
  }

  emitRoomsUpdated() {
    if (!this.server) return
    this.server.emit('rooms.updated', {})
  }

  emitDirectMessageCreated(
    userIds: [string, string],
    payload: DirectMessageCreatedEvent,
  ) {
    if (!this.server) return
    const [a, b] = userIds
    this.server
      .to(userRoom(a))
      .to(userRoom(b))
      .to(dmRoom(a, b))
      .emit('dm.created', payload)
  }

  emitDmSeen(userIds: [string, string], payload: DmSeenEvent) {
    if (!this.server) return
    const [a, b] = userIds
    this.server.to(userRoom(a)).emit('dm.seen', payload)
    this.server.to(userRoom(b)).emit('dm.seen', payload)
    this.server.to(dmRoom(a, b)).emit('dm.seen', payload)
  }
}
