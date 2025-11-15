import { FastifyReply, FastifyRequest } from "fastify";
import { app } from "../app";
import { validateDto } from "../utils/validation";
import { HttpStatusCode } from "../utils/httpStatusCodes";
import {
  SendFriendRequestDto,
  AcceptFriendRequestDto,
  RejectFriendRequestDto,
  CancelFriendRequestDto,
  UnfriendDto,
} from "./dtos/friend.dto";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  unfriend,
  getFriends,
  getPendingRequests,
  getSentRequests,
} from "./friend.service";

async function sendFriendRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { data, errors } = await validateDto(SendFriendRequestDto, request.body);
  if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({ errors });

  const senderId = request.userId!!;

  try {
    const requestId = sendFriendRequest(senderId, data!.receiverId);
    return reply.code(HttpStatusCode.CREATED).send({ requestId });
  } catch (error: any) {
    return reply
      .code(HttpStatusCode.BAD_REQUEST)
      .send({ error: error.message });
  }
}

async function acceptFriendRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { data, errors } = await validateDto(AcceptFriendRequestDto, request.params);
  if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({ errors });

  const userId = request.userId!!;

  try {
    const result = acceptFriendRequest(data!.requestId, userId);
    return reply.send(result);
  } catch (error: any) {
    return reply
      .code(HttpStatusCode.BAD_REQUEST)
      .send({ error: error.message });
  }
}

async function rejectFriendRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { data, errors } = await validateDto(RejectFriendRequestDto, request.params);
  if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({ errors });

  const userId = request.userId!!;

  try {
    rejectFriendRequest(data!.requestId, userId);
    return reply.send({ message: "Friend request rejected" });
  } catch (error: any) {
    return reply
      .code(HttpStatusCode.BAD_REQUEST)
      .send({ error: error.message });
  }
}

async function cancelFriendRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { data, errors } = await validateDto(CancelFriendRequestDto, request.params);
  if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({ errors });

  const senderId = request.userId!!;

  try {
    cancelFriendRequest(data!.requestId, senderId);
    return reply.send({ message: "Friend request cancelled" });
  } catch (error: any) {
    return reply
      .code(HttpStatusCode.BAD_REQUEST)
      .send({ error: error.message });
  }
}

async function unfriendHandler(request: FastifyRequest, reply: FastifyReply) {
  const { data, errors } = await validateDto(UnfriendDto, request.params);
  if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({ errors });

  const userId = request.userId!!;

  try {
    unfriend(userId, data!.friendId);
    return reply.send({ message: "Unfriended successfully" });
  } catch (error: any) {
    return reply
      .code(HttpStatusCode.BAD_REQUEST)
      .send({ error: error.message });
  }
}

async function getFriendsHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.userId!!;

  try {
    const friends = getFriends(userId);
    return reply.send({ friends });
  } catch (error: any) {
    return reply
      .code(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .send({ error: error.message });
  }
}

async function getPendingRequestsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.userId!!;

  try {
    const requests = getPendingRequests(userId);
    return reply.send({ requests });
  } catch (error: any) {
    return reply
      .code(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .send({ error: error.message });
  }
}

async function getSentRequestsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.userId!!;

  try {
    const requests = getSentRequests(userId);
    return reply.send({ requests });
  } catch (error: any) {
    return reply
      .code(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .send({ error: error.message });
  }
}

export default async function registerFriendRoutes() {
  app.post("/friends/request", sendFriendRequestHandler);
  app.post("/friends/request/:requestId/accept", acceptFriendRequestHandler);
  app.post("/friends/request/:requestId/reject", rejectFriendRequestHandler);
  app.delete("/friends/request/:requestId", cancelFriendRequestHandler);
  app.delete("/friends/:friendId", unfriendHandler);
  app.get("/friends", getFriendsHandler);
  app.get("/friends/requests/received", getPendingRequestsHandler);
  app.get("/friends/requests/sent", getSentRequestsHandler);
}

