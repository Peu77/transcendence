import { v4 as uuid } from "uuid";
import { get, run, all } from "../db/helpers";
import { MessageRow, ConversationRow, ConversationParticipantRow } from "../db/types";
import { areFriends } from "../friends/friend.service";

export function sendMessage(senderId: string, conversationId: string, content: string) {
  const participant = get<ConversationParticipantRow>(
    "SELECT * FROM conversation_participants WHERE conversationId = ? AND userId = ?",
    conversationId,
    senderId
  );

  if (!participant) {
    throw new Error("Not authorized to send messages in this conversation");
  }

  const messageId = uuid();
  run(
    "INSERT INTO messages (id, conversationId, senderId, content) VALUES (?, ?, ?, ?)",
    messageId,
    conversationId,
    senderId,
    content
  );

  return messageId;
}

export function getConversation(userId: string, otherUserId: string) {
  if (!areFriends(userId, otherUserId)) {
    throw new Error("Users are not friends");
  }

  const existingConversation = get<ConversationRow>(
    `SELECT c.* FROM conversations c
    INNER JOIN conversation_participants cp1 ON c.id = cp1.conversationId
    INNER JOIN conversation_participants cp2 ON c.id = cp2.conversationId
    WHERE c.type = 'direct'
    AND cp1.userId = ?
    AND cp2.userId = ?`,
    userId,
    otherUserId
  );

  if (existingConversation) {
    return existingConversation.id;
  }

  const conversationId = uuid();
  run(
    "INSERT INTO conversations (id, type) VALUES (?, 'direct')",
    conversationId
  );

  run(
    "INSERT INTO conversation_participants (conversationId, userId) VALUES (?, ?), (?, ?)",
    conversationId,
    userId,
    conversationId,
    otherUserId
  );

  return conversationId;
}

export function getMessages(
  conversationId: string,
  userId: string,
  limit: number = 50,
  offset: number = 0
) {

	const participant = get<ConversationParticipantRow>(
    "SELECT * FROM conversation_participants WHERE conversationId = ? AND userId = ?",
    conversationId,
    userId
  );

  if (!participant) {
    throw new Error("Not authorized to view this conversation");
  }

  const messages = all<MessageRow & { senderEmail: string; senderProfilePictureId: string | null }>(
    `SELECT 
      m.id,
      m.conversationId,
      m.senderId,
      m.content,
      m.createdAt,
      u.email as senderEmail,
      u.profilePictureId as senderProfilePictureId
    FROM messages m
    LEFT JOIN users u ON m.senderId = u.id
    WHERE m.conversationId = ?
    ORDER BY m.createdAt DESC
    LIMIT ? OFFSET ?`,
    conversationId,
    limit,
    offset
  );

  return messages;
}

export function getConversationsForUser(userId: string) {
  const conversations = all<{
    conversationId: string;
    type: string;
    createdAt: string;
    lastMessageContent: string | null;
    lastMessageCreatedAt: string | null;
    otherUserId: string | null;
    otherUserEmail: string | null;
    otherUserProfilePictureId: string | null;
  }>(
    `SELECT 
      c.id as conversationId,
      c.type,
      c.createdAt,
      m.content as lastMessageContent,
      m.createdAt as lastMessageCreatedAt,
      cp2.userId as otherUserId,
      u.email as otherUserEmail,
      u.profilePictureId as otherUserProfilePictureId
    FROM conversations c
    INNER JOIN conversation_participants cp1 ON c.id = cp1.conversationId
    LEFT JOIN conversation_participants cp2 ON c.id = cp2.conversationId AND cp2.userId != ?
    LEFT JOIN users u ON cp2.userId = u.id
    LEFT JOIN (
      SELECT conversationId, content, createdAt,
        ROW_NUMBER() OVER (PARTITION BY conversationId ORDER BY createdAt DESC) as rn
      FROM messages
    ) m ON c.id = m.conversationId AND m.rn = 1
    WHERE cp1.userId = ?
    ORDER BY m.createdAt DESC`,
    userId,
    userId
  );

  return conversations;
}

