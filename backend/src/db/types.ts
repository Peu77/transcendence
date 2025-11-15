export interface UserRow {
  id: string;
  email: string;
  profilePictureId: string | null;
  password: string;
  twoFaEnabled: number;
  twoFaSecret: string | null;
  createdAt: string;
}

export interface TwoFARow {
  id: string;
  userId: string;
  secret: string;
  createdAt: string;
  expiredAt: string;
}

export interface FriendRequestRow {
  id: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
}

export interface FriendshipRow {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: string;
}

export interface ConversationRow {
  id: string;
  type: 'direct' | 'group' | 'game_room';
  createdAt: string;
}

export interface ConversationParticipantRow {
  conversationId: string;
  userId: string;
  joinedAt: string;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}
