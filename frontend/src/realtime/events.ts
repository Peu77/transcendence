import type {
  DirectMessage,
  PresenceStatus,
  FriendRequestUser,
} from "@/api/friends";

export type FriendRequestCreatedEvent = {
  requestId: string;
  fromUser: FriendRequestUser;
  toUser: { id: string };
  createdAt: string;
};

export type FriendRequestResolvedEvent = {
  requestId: string;
  fromUserId: string;
  toUserId: string;
  resolvedAt: string;
};

export type FriendshipDeletedEvent = {
  userId: string;
  friendUserId: string;
  deletedAt: string;
};

export type PresenceUpdatedEvent = {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: string | null;
  updatedAt: string;
};

export type DirectMessageCreatedEvent = DirectMessage;

export type LiveEventMap = {
  ready: { userId: string };
  "friend_request.created": FriendRequestCreatedEvent;
  "friend_request.accepted": FriendRequestResolvedEvent;
  "friend_request.denied": FriendRequestResolvedEvent;
  "friend_request.canceled": FriendRequestResolvedEvent;
  "friendship.deleted": FriendshipDeletedEvent;
  "presence.updated": PresenceUpdatedEvent;
  "dm.created": DirectMessageCreatedEvent;
};
