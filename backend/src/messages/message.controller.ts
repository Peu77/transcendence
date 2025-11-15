import { FastifyReply, FastifyRequest } from "fastify";
import { app } from "../app";
import { validateDto } from "../utils/validation";
import { HttpStatusCode } from "../utils/httpStatusCodes";
import {
  SendMessageDto,
  GetConversationDto,
  GetMessagesDto,
} from "./dtos/message.dto";
import {
  sendMessage,
  getConversation,
  getMessages,
  getConversationsForUser,
} from "./message.service";

async function sendMessageHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { data, errors } = await validateDto(SendMessageDto, request.body);
  if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({ errors });

  const senderId = request.userId!!;

  try {
    const messageId = sendMessage(senderId, data!.conversationId, data!.content);
    return reply.code(HttpStatusCode.CREATED).send({ messageId });
  } catch (error: any) {
    return reply
      .code(HttpStatusCode.BAD_REQUEST)
      .send({ error: error.message });
  }
}

async function getConversationHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { data, errors } = await validateDto(GetConversationDto, request.params);
  if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({ errors });

  const userId = request.userId!!;

  try {
    const conversationId = getConversation(userId, data!.userId);
    return reply.send({ conversationId });
  } catch (error: any) {
    return reply
      .code(HttpStatusCode.BAD_REQUEST)
      .send({ error: error.message });
  }
}

async function getMessagesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { data, errors } = await validateDto(
    GetMessagesDto,
    Object.assign({}, request.params, request.query)
  );
  if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({ errors });

  const userId = request.userId!!;
  const limit = data!.limit || 50;
  const offset = data!.offset || 0;

  try {
    const messages = getMessages(data!.conversationId, userId, limit, offset);
    return reply.send({ messages });
  } catch (error: any) {
    return reply
      .code(HttpStatusCode.BAD_REQUEST)
      .send({ error: error.message });
  }
}

async function getConversationsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.userId!!;

  try {
    const conversations = getConversationsForUser(userId);
    return reply.send({ conversations });
  } catch (error: any) {
    return reply
      .code(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .send({ error: error.message });
  }
}

export default async function registerMessageRoutes() {
  app.post("/messages", sendMessageHandler);
  app.get("/messages/conversations/:userId", getConversationHandler);
  app.get("/messages/:conversationId", getMessagesHandler);
  app.get("/messages/conversations", getConversationsHandler);
}

