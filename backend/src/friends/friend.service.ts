import { v4 as uuid } from "uuid";
import { get, run, all } from "../db/helpers";
import { FriendRequestRow, FriendshipRow, UserRow } from "../db/types";

export function sendFriendRequest(senderId: string, receiverId: string) {
  if (areFriends(senderId, receiverId)) {
    throw new Error("Users are already friends");
  }

  const existingRequest = get<FriendRequestRow>(
    "SELECT * FROM friend_requests WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)",
    senderId,
    receiverId,
    receiverId,
    senderId
  );

  if (existingRequest) {
    throw new Error("Friend request already exists");
  }

  const requestId = uuid();
  run(
    "INSERT INTO friend_requests (id, senderId, receiverId) VALUES (?, ?, ?)",
    requestId,
    senderId,
    receiverId
  );

  return requestId;
}

export function acceptFriendRequest(requestId: string, userId: string) {
  const request = get<FriendRequestRow>(
    "SELECT * FROM friend_requests WHERE id = ?",
    requestId
  );

  if (!request) {
    throw new Error("Friend request not found");
  }

  if (request.receiverId !== userId) {
    throw new Error("Not authorized to accept this request");
  }

  const friendshipId = uuid();
  // userId1 < userId2 for consistency with later checks
  const [userId1, userId2] = request.senderId < request.receiverId 
    ? [request.senderId, request.receiverId]
    : [request.receiverId, request.senderId];

  run(
    "INSERT INTO friendships (id, userId1, userId2) VALUES (?, ?, ?)",
    friendshipId,
    userId1,
    userId2
  );

  run("DELETE FROM friend_requests WHERE id = ?", requestId);

  const conversationId = uuid();
  run(
    "INSERT INTO conversations (id, type) VALUES (?, 'direct')",
    conversationId
  );

  run(
    "INSERT INTO conversation_participants (conversationId, userId) VALUES (?, ?), (?, ?)",
    conversationId,
    request.senderId,
    conversationId,
    request.receiverId
  );

  return { friendshipId, conversationId };
}

export function rejectFriendRequest(requestId: string, userId: string) {
  const request = get<FriendRequestRow>(
    "SELECT * FROM friend_requests WHERE id = ?",
    requestId
  );

  if (!request) {
    throw new Error("Friend request not found");
  }

  if (request.receiverId !== userId) {
    throw new Error("Not authorized to reject this request");
  }

  run("DELETE FROM friend_requests WHERE id = ?", requestId);
}

export function cancelFriendRequest(requestId: string, senderId: string) {
  const request = get<FriendRequestRow>(
    "SELECT * FROM friend_requests WHERE id = ?",
    requestId
  );

  if (!request) {
    throw new Error("Friend request not found");
  }

  if (request.senderId !== senderId) {
    throw new Error("Not authorized to cancel this request");
  }

  run("DELETE FROM friend_requests WHERE id = ?", requestId);
}

export function unfriend(userId: string, friendId: string) {
  const [userId1, userId2] = userId < friendId ? [userId, friendId] : [friendId, userId];

  const friendship = get<FriendshipRow>(
    "SELECT * FROM friendships WHERE userId1 = ? AND userId2 = ?",
    userId1,
    userId2
  );

  if (!friendship) {
    throw new Error("Friendship not found");
  }

  run(
    "DELETE FROM friendships WHERE userId1 = ? AND userId2 = ?",
    userId1,
    userId2
  );
}

export function getFriends(userId: string) {
  const friendships = all<FriendshipRow & { email: string; profilePictureId: string | null }>(
    `SELECT 
      f.id,
      f.userId1,
      f.userId2,
      f.createdAt,
      CASE 
        WHEN f.userId1 = ? THEN u2.email
        ELSE u1.email
      END as email,
      CASE 
        WHEN f.userId1 = ? THEN u2.profilePictureId
        ELSE u1.profilePictureId
      END as profilePictureId,
      CASE 
        WHEN f.userId1 = ? THEN f.userId2
        ELSE f.userId1
      END as friendId
    FROM friendships f
    LEFT JOIN users u1 ON f.userId1 = u1.id
    LEFT JOIN users u2 ON f.userId2 = u2.id
    WHERE f.userId1 = ? OR f.userId2 = ?`,
    userId,
    userId,
    userId,
    userId,
    userId
  );

  return friendships;
}

export function getPendingRequests(userId: string) {
  const requests = all<FriendRequestRow & { senderEmail: string; senderProfilePictureId: string | null }>(
    `SELECT 
      fr.id,
      fr.senderId,
      fr.receiverId,
      fr.createdAt,
      u.email as senderEmail,
      u.profilePictureId as senderProfilePictureId
    FROM friend_requests fr
    LEFT JOIN users u ON fr.senderId = u.id
    WHERE fr.receiverId = ?`,
    userId
  );

  return requests;
}

export function getSentRequests(userId: string) {
  const requests = all<FriendRequestRow & { receiverEmail: string; receiverProfilePictureId: string | null }>(
    `SELECT 
      fr.id,
      fr.senderId,
      fr.receiverId,
      fr.createdAt,
      u.email as receiverEmail,
      u.profilePictureId as receiverProfilePictureId
    FROM friend_requests fr
    LEFT JOIN users u ON fr.receiverId = u.id
    WHERE fr.senderId = ?`,
    userId
  );

  return requests;
}

export function areFriends(userId1: string, userId2: string): boolean {
  const [smallerId, largerId] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  const friendship = get<FriendshipRow>(
    "SELECT * FROM friendships WHERE userId1 = ? AND userId2 = ?",
    smallerId,
    largerId
  );

  return !!friendship;
}

