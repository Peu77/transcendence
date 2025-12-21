import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { ConfigService } from "@nestjs/config";
import { verify } from "jsonwebtoken";
import type { Server, Socket } from "socket.io";
import { REALTIME_NAMESPACE, dmRoom, userRoom } from "./realtime.constants";
import { RealtimeService } from "./realtime.service";

type SocketAuthUser = { userId: string };

function parseCookie(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

@WebSocketGateway({
  namespace: REALTIME_NAMESPACE,
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly jwtSecret: string;

  constructor(
    configService: ConfigService,
    private readonly realtime: RealtimeService,
  ) {
    this.jwtSecret = configService.getOrThrow<string>("JWT_SECRET");
  }

  afterInit(server: Server) {
    this.realtime.setServer(server);
  }

  private authenticate(client: Socket): SocketAuthUser {
    // Support JWT via cookie token OR Authorization header OR socket.io auth.token
    const cookie = parseCookie(client.handshake.headers.cookie);
    const cookieToken = cookie.token;

    const authHeader = client.handshake.headers.authorization;
    const bearerToken =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : undefined;

    const authToken =
      typeof client.handshake.auth?.token === "string"
        ? client.handshake.auth.token
        : undefined;

    const token = cookieToken ?? bearerToken ?? authToken ?? "";
    const decoded: any = verify(token, this.jwtSecret);
    if (!decoded || typeof decoded === "string" || !decoded.userId) {
      throw new Error("Unauthorized");
    }
    return { userId: decoded.userId };
  }

  async handleConnection(client: Socket) {
    try {
      const { userId } = this.authenticate(client);
      client.data.userId = userId;
      await client.join(userRoom(userId));
      client.emit("ready", { userId });
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(_client: Socket) {
  }

  @SubscribeMessage("dm.join")
  async joinDm(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { withUserId: string },
  ) {
    const me: string | undefined = client.data.userId;
    if (!me) return { ok: false };
    if (!body?.withUserId) return { ok: false };

    await client.join(dmRoom(me, body.withUserId));
    return { ok: true };
  }

  @SubscribeMessage("dm.leave")
  async leaveDm(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { withUserId: string },
  ) {
    const me: string | undefined = client.data.userId;
    if (!me) return { ok: false };
    if (!body?.withUserId) return { ok: false };

    await client.leave(dmRoom(me, body.withUserId));
    return { ok: true };
  }
}
