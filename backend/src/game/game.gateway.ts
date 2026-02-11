import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { ConfigService } from "@nestjs/config";
import { verify } from "jsonwebtoken";
import type { Server, Socket } from "socket.io";
import { TetrisGame } from "./tetris/TetrisGame";
import type { InputAction } from "./tetris/tetris.types";
import { Logger } from "@nestjs/common";

/* ------------------------------------------------------------------ */
/*  Cookie parser (same as RealtimeGateway)                           */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Per-user game session state                                       */
/* ------------------------------------------------------------------ */

/** How long a paused/disconnected session stays alive before being cleaned up */
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface GameSession {
  game: TetrisGame;
  /** The game-loop timeout handle (null when paused / not started) */
  tickTimer: ReturnType<typeof setTimeout> | null;
  /** The currently-attached socket (null when disconnected) */
  socketId: string | null;
  /** Auto-cleanup timer for abandoned paused sessions */
  abandonTimer: ReturnType<typeof setTimeout> | null;
}

/* ------------------------------------------------------------------ */
/*  Gateway                                                            */
/* ------------------------------------------------------------------ */

@WebSocketGateway({
  namespace: "/game",
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  server!: Server;

  /** Sessions keyed by userId so they survive socket reconnects */
  private sessions = new Map<string, GameSession>();

  private readonly jwtSecret: string;

  constructor(configService: ConfigService) {
    this.jwtSecret = configService.getOrThrow<string>("JWT_SECRET");
  }

  /* ---------------------------------------------------------------- */
  /*  Connection lifecycle                                             */
  /* ---------------------------------------------------------------- */

  handleConnection(client: Socket) {
    try {
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

      const userId = decoded.userId as string;
      client.data.userId = userId;

      const existing = this.sessions.get(userId);
      if (existing && !existing.game.gameOver) {
        existing.socketId = client.id;
        if (existing.abandonTimer) {
          clearTimeout(existing.abandonTimer);
          existing.abandonTimer = null;
        }
        this.logger.log(`Game client reconnected: ${client.id} (user ${userId}) — session exists (paused=${existing.game.paused})`);
        client.emit("ready", { userId, hasSession: true, paused: existing.game.paused });
      } else {
        this.logger.log(`Game client connected: ${client.id} (user ${userId}) — no session`);
        client.emit("ready", { userId, hasSession: false, paused: false });
      }
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId: string | undefined = client.data.userId;
    if (!userId) return;

    const session = this.sessions.get(userId);
    if (!session) return;

    if (session.socketId !== client.id) return;

    this.pauseSession(session);
    session.socketId = null;

    session.abandonTimer = setTimeout(() => {
      this.logger.log(`Session for user ${userId} abandoned after timeout — cleaning up`);
      this.destroySession(userId);
    }, SESSION_TIMEOUT_MS);

    this.logger.log(`Game client disconnected: ${client.id} (user ${userId}) — session paused, waiting for reconnect`);
  }

  /* ---------------------------------------------------------------- */
  /*  Game events                                                      */
  /* ---------------------------------------------------------------- */

  @SubscribeMessage("tetris.start")
  handleStart(@ConnectedSocket() client: Socket) {
    const userId: string | undefined = client.data.userId;
    if (!userId) return;

    this.destroySession(userId);

    const game = new TetrisGame();
    const session: GameSession = {
      game,
      tickTimer: null,
      socketId: client.id,
      abandonTimer: null,
    };
    this.sessions.set(userId, session);

    this.logger.log(`Tetris game started for user ${userId} (socket ${client.id})`);

    let count = 3;
    const countdownInterval = setInterval(() => {
      client.emit("tetris.countdown", { count });

      if (count === 0) {
        clearInterval(countdownInterval);
        client.emit("tetris.state", game.getState());
        this.startGameLoop(userId, session);
      }
      count--;
    }, 1000);

    return { ok: true };
  }

  @SubscribeMessage("tetris.input")
  handleInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { action: InputAction },
  ) {
    const userId: string | undefined = client.data.userId;
    if (!userId) return;

    const session = this.sessions.get(userId);
    if (!session || session.game.gameOver || session.game.paused) return;
    if (!body?.action) return;

    session.game.processInput(body.action);
    this.emitToSession(session, "tetris.state", session.game.getState());
  }

  @SubscribeMessage("tetris.pause")
  handlePause(@ConnectedSocket() client: Socket) {
    const userId: string | undefined = client.data.userId;
    if (!userId) return;

    const session = this.sessions.get(userId);
    if (!session || session.game.gameOver || session.game.paused) return;

    this.pauseSession(session);
    this.emitToSession(session, "tetris.paused", session.game.getState());
    this.logger.log(`Game paused by user ${userId}`);
  }

  @SubscribeMessage("tetris.resume")
  handleResume(@ConnectedSocket() client: Socket) {
    const userId: string | undefined = client.data.userId;
    if (!userId) return;

    const session = this.sessions.get(userId);
    if (!session || session.game.gameOver || !session.game.paused) return;

    session.game.resume();
    session.socketId = client.id;
    this.emitToSession(session, "tetris.resumed", session.game.getState());
    this.startGameLoop(userId, session);
    this.logger.log(`Game resumed by user ${userId}`);
  }

  @SubscribeMessage("tetris.reconnect")
  handleReconnect(@ConnectedSocket() client: Socket) {
    const userId: string | undefined = client.data.userId;
    if (!userId) return;

    const session = this.sessions.get(userId);
    if (!session || session.game.gameOver) {
      client.emit("tetris.no-session");
      return;
    }

    session.socketId = client.id;
    if (session.abandonTimer) {
      clearTimeout(session.abandonTimer);
      session.abandonTimer = null;
    }

    client.emit("tetris.session-found", session.game.getState());
    this.logger.log(`Session restored for user ${userId} (socket ${client.id})`);
  }

  /* ---------------------------------------------------------------- */
  /*  Internal helpers                                                 */
  /* ---------------------------------------------------------------- */

  private startGameLoop(userId: string, session: GameSession) {
    if (session.tickTimer) {
      clearTimeout(session.tickTimer);
      session.tickTimer = null;
    }

    const tick = () => {
      if (session.game.paused || session.game.gameOver) return;

      const running = session.game.tick();
      const state = session.game.getState();
      this.emitToSession(session, "tetris.state", state);

      if (!running) {
        this.emitToSession(session, "tetris.gameover", {
          score: state.score,
          lines: state.lines,
          level: state.level,
        });
        this.destroySession(userId);
        return;
      }

      session.tickTimer = setTimeout(tick, session.game.getTickInterval());
    };

    session.tickTimer = setTimeout(tick, session.game.getTickInterval());
  }

  private pauseSession(session: GameSession) {
    session.game.pause();
    if (session.tickTimer) {
      clearTimeout(session.tickTimer);
      session.tickTimer = null;
    }
  }

  private destroySession(userId: string) {
    const session = this.sessions.get(userId);
    if (!session) return;
    if (session.tickTimer) clearTimeout(session.tickTimer);
    if (session.abandonTimer) clearTimeout(session.abandonTimer);
    this.sessions.delete(userId);
  }

  private emitToSession(session: GameSession, event: string, data: unknown) {
    if (!session.socketId) return;
    this.server.to(session.socketId).emit(event, data);
  }
}
