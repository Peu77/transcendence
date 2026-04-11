import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { ConfigService } from '@nestjs/config'
import { Logger } from '@nestjs/common'
import { verify } from 'jsonwebtoken'
import type { Server, Socket } from 'socket.io'
import {
  REALTIME_NAMESPACE,
  dmRoom,
  gameRoom,
  userRoom,
} from './realtime.constants'
import { RealtimeService } from './realtime.service'
import { RealtimePresenceService } from './realtime-presence.service'
import { RoomService } from '../room/room.service'
import { TetrisGame } from '../game/tetris/TetrisGame'
import type { InputAction, TetrisState } from '../game/tetris/tetris.types'

type SocketAuthUser = { userId: string }

interface PlayerGame {
  game: TetrisGame
  tickTimer: ReturnType<typeof setTimeout> | null
}

interface RoomGameSession {
  players: Map<string, PlayerGame> // userId → their game
  roomId: string
}

function parseCookie(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!cookieHeader) return out
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    out[k] = decodeURIComponent(v)
  }
  return out
}

@WebSocketGateway({
  namespace: REALTIME_NAMESPACE,
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name)

  @WebSocketServer()
  server!: Server

  private readonly jwtSecret: string
  private gameSessions = new Map<string, RoomGameSession>() // roomId → session

  constructor(
    configService: ConfigService,
    private readonly realtime: RealtimeService,
    private readonly realtimePresence: RealtimePresenceService,
    private readonly roomService: RoomService,
  ) {
    this.jwtSecret = configService.getOrThrow<string>('JWT_SECRET')
  }

  afterInit(server: Server) {
    this.realtime.setServer(server)
  }

  private authenticate(client: Socket): SocketAuthUser {
    // Support JWT via cookie token OR Authorization header OR socket.io auth.token
    const cookie = parseCookie(client.handshake.headers.cookie)
    const cookieToken = cookie.token

    const authHeader = client.handshake.headers.authorization
    const bearerToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : undefined

    const authToken =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : undefined

    const token = cookieToken ?? bearerToken ?? authToken ?? ''
    const decoded: any = verify(token, this.jwtSecret)
    if (!decoded || typeof decoded === 'string' || !decoded.userId) {
      throw new Error('Unauthorized')
    }
    return { userId: decoded.userId }
  }

  async handleConnection(client: Socket) {
    try {
      const { userId } = this.authenticate(client)
      client.data.userId = userId
      await client.join(userRoom(userId))
      client.emit('ready', { userId })
    } catch {
      client.disconnect(true)
    }
  }

  async handleDisconnect(client: Socket) {
    const userId: string | undefined = client.data.userId
    if (!userId) return

    console.log(`Socket disconnected for user ${userId}`)

    // Clean up any game sessions this user was part of
    for (const [roomId, session] of this.gameSessions) {
      if (session.players.has(userId)) {
        this.handlePlayerDisconnectFromGame(roomId, userId)
      }
    }

    this.roomService.leaveAllRooms(userId)

    // Only mark offline if this was the last active socket for that user.
    // Socket keeps room membership until after disconnect completes, so we check on next tick.
    setTimeout(async () => {
      try {
        const room = userRoom(userId)
        const sockets = await this.server.in(room).fetchSockets()
        if (sockets.length > 0) return
        await this.realtimePresence.setOffline(userId)
      } catch {
        // best-effort
      }
    }, 0)
  }

  @SubscribeMessage('room.join')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId: string | undefined = client.data.userId
    console.log(
      `room.join message received: roomId=${body?.roomId}, userId=${userId}`,
    )
    if (!userId) return { ok: false, error: 'Unauthorized' }
    if (!body?.roomId) return { ok: false, error: 'Missing roomId' }

    try {
      await this.roomService.joinRoom(body.roomId, userId)
      await client.join(gameRoom(body.roomId))
      console.log(`room.join SUCCESS: roomId=${body.roomId}, userId=${userId}`)
      return { ok: true }
    } catch (e: any) {
      console.error(`room.join ERROR: ${e.message}`)
      return { ok: false, error: e.message }
    }
  }

  @SubscribeMessage('room.leave')
  async leaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId: string | undefined = client.data.userId
    if (!userId) return { ok: false }
    if (!body?.roomId) return { ok: false }

    this.roomService.leaveRoom(body.roomId, userId)
    await client.leave(gameRoom(body.roomId))
    return { ok: true }
  }

  @SubscribeMessage('dm.join')
  async joinDm(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { withUserId: string },
  ) {
    const me: string | undefined = client.data.userId
    if (!me) return { ok: false }
    if (!body?.withUserId) return { ok: false }

    await client.join(dmRoom(me, body.withUserId))
    return { ok: true }
  }

  @SubscribeMessage('dm.leave')
  async leaveDm(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { withUserId: string },
  ) {
    const me: string | undefined = client.data.userId
    if (!me) return { ok: false }
    if (!body?.withUserId) return { ok: false }

    await client.leave(dmRoom(me, body.withUserId))
    return { ok: true }
  }

  /* ---------------------------------------------------------------- */
  /*  Game events                                                      */
  /* ---------------------------------------------------------------- */

  @SubscribeMessage('game.start')
  handleGameStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId: string | undefined = client.data.userId
    if (!userId || !body?.roomId) return { ok: false, error: 'Invalid request' }

    const { roomId } = body

    try {
      const room = this.roomService.startGame(roomId, userId)

      // Destroy any existing session for this room
      this.destroyGameSession(roomId)

      // Create a game for each player in the room
      const session: RoomGameSession = {
        players: new Map(),
        roomId,
      }

      for (const user of room.users) {
        session.players.set(user.id, {
          game: new TetrisGame(),
          tickTimer: null,
        })
      }

      this.gameSessions.set(roomId, session)
      this.logger.log(
        `Game started in room ${roomId} with ${room.users.length} players`,
      )

      // Countdown: 3, 2, 1, 0 (GO)
      let count = 3
      const countdownInterval = setInterval(() => {
        this.emitToGameRoom(roomId, 'game.countdown', { roomId, count })

        if (count === 0) {
          clearInterval(countdownInterval)
          // Emit initial state and start game loops
          this.emitAllPlayerStates(roomId)
          this.startAllGameLoops(roomId)
        }
        count--
      }, 1000)

      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  }

  @SubscribeMessage('game.input')
  handleGameInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string; action: InputAction },
  ) {
    const userId: string | undefined = client.data.userId
    if (!userId || !body?.roomId || !body?.action) return

    const session = this.gameSessions.get(body.roomId)
    if (!session) return

    const playerGame = session.players.get(userId)
    if (!playerGame || playerGame.game.gameOver || playerGame.game.paused)
      return

    playerGame.game.processInput(body.action)
    this.emitAllPlayerStates(body.roomId)

    // Check if this player's game is over after input (hard drop can cause game over)
    if (playerGame.game.gameOver) {
      this.handlePlayerGameOver(body.roomId, userId)
    }
  }

  @SubscribeMessage('game.pause')
  handleGamePause(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId: string | undefined = client.data.userId
    if (!userId || !body?.roomId) return

    const session = this.gameSessions.get(body.roomId)
    if (!session) return

    // Pause ALL games in the room
    for (const [, pg] of session.players) {
      if (!pg.game.gameOver) {
        pg.game.pause()
        if (pg.tickTimer) {
          clearTimeout(pg.tickTimer)
          pg.tickTimer = null
        }
      }
    }

    this.logger.log(`Game paused in room ${body.roomId} by user ${userId}`)
    this.emitToGameRoom(body.roomId, 'game.paused', {
      roomId: body.roomId,
      players: this.getAllPlayerStates(body.roomId),
    })
  }

  @SubscribeMessage('game.resume')
  handleGameResume(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId: string | undefined = client.data.userId
    if (!userId || !body?.roomId) return

    const session = this.gameSessions.get(body.roomId)
    if (!session) return

    // Resume ALL games in the room
    for (const [, pg] of session.players) {
      if (!pg.game.gameOver && pg.game.paused) {
        pg.game.resume()
      }
    }

    this.logger.log(`Game resumed in room ${body.roomId} by user ${userId}`)
    this.emitToGameRoom(body.roomId, 'game.resumed', {
      roomId: body.roomId,
      players: this.getAllPlayerStates(body.roomId),
    })

    // Restart game loops for non-game-over players
    this.startAllGameLoops(body.roomId)
  }

  /* ---------------------------------------------------------------- */
  /*  Game helpers                                                     */
  /* ---------------------------------------------------------------- */

  private emitToGameRoom(roomId: string, event: string, data: unknown) {
    this.server.to(gameRoom(roomId)).emit(event, data)
  }

  private getAllPlayerStates(roomId: string): Record<string, TetrisState> {
    const session = this.gameSessions.get(roomId)
    if (!session) return {}

    const states: Record<string, TetrisState> = {}
    for (const [userId, pg] of session.players) {
      states[userId] = pg.game.getState()
    }
    return states
  }

  private emitAllPlayerStates(roomId: string) {
    this.emitToGameRoom(roomId, 'game.state', {
      roomId,
      players: this.getAllPlayerStates(roomId),
    })
  }

  private startAllGameLoops(roomId: string) {
    const session = this.gameSessions.get(roomId)
    if (!session) return

    for (const [userId, pg] of session.players) {
      if (!pg.game.gameOver && !pg.game.paused) {
        this.startPlayerGameLoop(roomId, userId, pg)
      }
    }
  }

  private startPlayerGameLoop(
    roomId: string,
    userId: string,
    playerGame: PlayerGame,
  ) {
    if (playerGame.tickTimer) {
      clearTimeout(playerGame.tickTimer)
      playerGame.tickTimer = null
    }

    const tick = () => {
      if (playerGame.game.paused || playerGame.game.gameOver) return

      const running = playerGame.game.tick()
      this.emitAllPlayerStates(roomId)

      if (!running) {
        this.handlePlayerGameOver(roomId, userId)
        return
      }

      playerGame.tickTimer = setTimeout(tick, playerGame.game.getTickInterval())
    }

    playerGame.tickTimer = setTimeout(tick, playerGame.game.getTickInterval())
  }

  private handlePlayerGameOver(roomId: string, userId: string) {
    const session = this.gameSessions.get(roomId)
    if (!session) return

    const pg = session.players.get(userId)
    if (!pg) return

    // Stop the player's game loop
    if (pg.tickTimer) {
      clearTimeout(pg.tickTimer)
      pg.tickTimer = null
    }

    const state = pg.game.getState()
    this.emitToGameRoom(roomId, 'game.player-over', {
      roomId,
      userId,
      score: state.score,
      lines: state.lines,
      level: state.level,
    })

    // Check if ALL players are game over
    const allOver = Array.from(session.players.values()).every(
      (p) => p.game.gameOver,
    )
    if (allOver) {
      this.handleAllPlayersGameOver(roomId)
    }
  }

  private handleAllPlayersGameOver(roomId: string) {
    const session = this.gameSessions.get(roomId)
    if (!session) return

    let room
    try {
      room = this.roomService.getRoom(roomId)
    } catch {
      return
    }

    const results = Array.from(session.players.entries()).map(
      ([userId, pg]) => {
        const state = pg.game.getState()
        const user = room.users.find((u) => u.id === userId)
        return {
          userId,
          username: user?.username ?? 'Unknown',
          score: state.score,
          lines: state.lines,
          level: state.level,
        }
      },
    )

    // Sort by score descending
    results.sort((a, b) => b.score - a.score)

    this.emitToGameRoom(roomId, 'game.finished', { roomId, results })
    this.roomService.endGame(roomId)
    this.destroyGameSession(roomId)
  }

  private handlePlayerDisconnectFromGame(roomId: string, userId: string) {
    const session = this.gameSessions.get(roomId)
    if (!session) return

    const pg = session.players.get(userId)
    if (!pg) return

    // Mark disconnected player's game as over
    if (pg.tickTimer) {
      clearTimeout(pg.tickTimer)
      pg.tickTimer = null
    }
    pg.game.gameOver = true

    this.emitToGameRoom(roomId, 'game.player-over', {
      roomId,
      userId,
      score: pg.game.getState().score,
      lines: pg.game.getState().lines,
      level: pg.game.getState().level,
    })

    // Check if all players are now game over
    const allOver = Array.from(session.players.values()).every(
      (p) => p.game.gameOver,
    )
    if (allOver) {
      this.handleAllPlayersGameOver(roomId)
    }
  }

  private destroyGameSession(roomId: string) {
    const session = this.gameSessions.get(roomId)
    if (!session) return

    for (const [, pg] of session.players) {
      if (pg.tickTimer) clearTimeout(pg.tickTimer)
    }
    this.gameSessions.delete(roomId)
  }
}
