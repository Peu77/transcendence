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
import { InjectRepository } from '@nestjs/typeorm'
import { verify } from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import type { Server, Socket } from 'socket.io'
import { Repository } from 'typeorm'
import {
  dmRoom,
  gameRoom,
  REALTIME_NAMESPACE,
  userRoom,
} from './realtime.constants'
import { RealtimeService } from './realtime.service'
import { RealtimePresenceService } from './realtime-presence.service'
import { RoomService } from '../room/room.service'
import {
  type InputAction,
  type MatchSettings,
  TetrisGame,
  type TetrisState,
  type TetrominoType,
} from '@transcendence/shared'
import { MatchResult } from '../users/match-result.entity'

type SocketAuthUser = { userId: string }

interface PlayerGame {
  game: TetrisGame
  tickTimer: ReturnType<typeof setTimeout> | null
  lastSeq: number
  placement: number | null
  targetId: string | null
  attackEventCount: number
}

interface RoomGameSession {
  players: Map<string, PlayerGame> // userId → their game
  roomId: string
  finishing: boolean
  startedAt: number // epoch ms, used to compute match duration
  nextPlacement: number
  settings: MatchSettings
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
    origin: process.env.CORS_ORIGIN ?? 'https://localhost',
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
  private readonly gameSessions = new Map<string, RoomGameSession>() // roomId → session

  constructor(
    configService: ConfigService,
    private readonly realtime: RealtimeService,
    private readonly realtimePresence: RealtimePresenceService,
    private readonly roomService: RoomService,
    @InjectRepository(MatchResult)
    private readonly matchResultsRepository: Repository<MatchResult>
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

    if (this.gameSessions.get(body.roomId)?.players.has(userId)) {
      this.handlePlayerDisconnectFromGame(body.roomId, userId)
    }
    this.roomService.leaveRoom(body.roomId, userId)
    await client.leave(gameRoom(body.roomId))
    return { ok: true }
  }

  @SubscribeMessage('room.chat.send')
  async sendRoomChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string; content: string },
  ) {
    const userId: string | undefined = client.data.userId
    if (!userId) return { ok: false, error: 'Unauthorized' }
    if (!body?.roomId) return { ok: false, error: 'Missing roomId' }

    const content = typeof body.content === 'string' ? body.content.trim() : ''
    if (!content) return { ok: false, error: 'Message is empty' }
    if (content.length > 500) return { ok: false, error: 'Message is too long' }

    try {
      const room = this.roomService.getRoom(body.roomId)
      if (!room.users.some((user) => user.id === userId)) {
        return { ok: false, error: 'You are not in this room' }
      }

      const sender = room.users.find((user) => user.id === userId)
      this.emitToGameRoom(body.roomId, 'room.chat.message', {
        id: `${Date.now()}-${userId}`,
        roomId: body.roomId,
        senderId: userId,
        senderInfo: {
          username: sender?.username ?? 'Player',
          profilePictureId: sender?.profilePictureId ?? null,
        },
        content,
        createdAt: new Date().toISOString(),
      })

      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
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
        finishing: false,
        startedAt: Date.now(),
        nextPlacement: room.users.length,
        settings: room.settings,
      }

      const seed = Math.floor(Math.random() * 0xffffffff)
      for (const user of room.users) {
        session.players.set(user.id, {
          game: new TetrisGame(room.settings, seed),
          tickTimer: null,
          lastSeq: 0,
          placement: null,
          targetId: null,
          attackEventCount: 0,
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
    @MessageBody() body: { roomId: string; action: InputAction; seq?: number },
  ) {
    const userId: string | undefined = client.data.userId
    if (!userId || !body?.roomId || !body?.action) return

    const session = this.gameSessions.get(body.roomId)
    if (!session) return

    const playerGame = session.players.get(userId)
    if (!playerGame || playerGame.game.gameOver) return

    const seq = typeof body.seq === 'number' ? body.seq : undefined
    if (seq !== undefined) {
      // Drop stale / out-of-order inputs so server order matches client prediction.
      if (seq <= playerGame.lastSeq) return
      playerGame.lastSeq = seq
    }

    playerGame.game.processInput(body.action)
    this.sendGarbageToOpponents(body.roomId, userId, playerGame.game)
    this.emitAllPlayerStates(body.roomId)

    // Check if this player's game is over after input (hard drop can cause game over)
    if (playerGame.game.gameOver) {
      this.handlePlayerGameOver(body.roomId, userId)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Game helpers                                                     */
  /* ---------------------------------------------------------------- */

  private emitToGameRoom(roomId: string, event: string, data: unknown) {
    this.server.to(gameRoom(roomId)).emit(event, data)
  }

  private emitAllPlayerStates(roomId: string) {
    const session = this.gameSessions.get(roomId)
    if (!session) return

    const players: Record<string, TetrisState> = {}
    const lastSeq: Record<string, number> = {}
    const predictionPieces: Record<string, TetrominoType[]> = {}

    for (const [userId, pg] of session.players) {
      players[userId] = pg.game.getState()
      lastSeq[userId] = pg.lastSeq
      predictionPieces[userId] = pg.game.getPredictionPieces(4)
    }

    this.emitToGameRoom(roomId, 'game.state', {
      roomId,
      players,
      lastSeq,
      predictionPieces,
    })
  }

  private startAllGameLoops(roomId: string) {
    const session = this.gameSessions.get(roomId)
    if (!session) return

    for (const [userId, pg] of session.players) {
      if (!pg.game.gameOver) {
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
      if (playerGame.game.gameOver) return

      const running = playerGame.game.tick()
      this.sendGarbageToOpponents(roomId, userId, playerGame.game)
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

    pg.placement = session.nextPlacement--
    this.retargetPlayersWhoTargeted(session, userId)

    const state = pg.game.getState()
    this.emitToGameRoom(roomId, 'game.player-over', {
      roomId,
      userId,
      score: state.score,
      lines: state.lines,
      level: state.level,
    })

    this.checkGameEndCondition(roomId)
  }

  private sendGarbageToOpponents(
    roomId: string,
    attackerUserId: string,
    attackerGame: TetrisGame,
  ) {
    const garbage = attackerGame.collectOutgoingGarbage()
    if (garbage <= 0) return

    const session = this.gameSessions.get(roomId)
    if (!session) return

    const attacker = session.players.get(attackerUserId)
    if (!attacker) return

    const alive = Array.from(session.players.entries()).filter(
      ([id, pg]) => id !== attackerUserId && !pg.game.gameOver,
    )
    if (alive.length === 0) return

    const K = session.settings.garbageTargetK
    const needsRetarget =
      attacker.targetId === null ||
      (K > 0 && attacker.attackEventCount >= K) ||
      !alive.some(([id]) => id === attacker.targetId)

    if (needsRetarget) {
      const [newTargetId] = alive[Math.floor(Math.random() * alive.length)]
      attacker.targetId = newTargetId
      attacker.attackEventCount = 0
      this.logger.log(`[targeting] ${attackerUserId} → new target: ${newTargetId}`)
    }

    const target = session.players.get(attacker.targetId!)
    if (!target) return

    target.game.receiveGarbage(garbage)
    attacker.attackEventCount++
    this.logger.log(
      `[targeting] ${attackerUserId} → ${attacker.targetId} | lines: ${garbage} | attacks on target: ${attacker.attackEventCount}/${K}`,
    )
  }

  private retargetPlayersWhoTargeted(session: RoomGameSession, deadUserId: string) {
    for (const [, pg] of session.players) {
      if (pg.targetId === deadUserId) {
        pg.targetId = null
        pg.attackEventCount = 0
      }
    }
  }

  private checkGameEndCondition(roomId: string) {
    const session = this.gameSessions.get(roomId)
    if (!session) return

    // Check if only one player (or zero) is left alive
    const totalPlayers = session.players.size
    const activePlayers = Array.from(session.players.values()).filter(
      (p) => !p.game.gameOver,
    )

    const shouldEnd =
      activePlayers.length === 0 ||
      (totalPlayers > 1 && activePlayers.length === 1)

    if (shouldEnd) {
      if (session.finishing) return
      session.finishing = true

      // Mark any remaining active player as game over so results are complete
      for (const p of activePlayers) {
        p.placement = session.nextPlacement--
        p.game.gameOver = true
        if (p.tickTimer) {
          clearTimeout(p.tickTimer)
          p.tickTimer = null
        }
      }
      void this.handleAllPlayersGameOver(roomId)
    }
  }

  private async handleAllPlayersGameOver(roomId: string) {
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
          placement: pg.placement ?? 1,
          score: state.score,
          lines: state.lines,
          level: state.level,
        }
      },
    )

    // Sort by placement ascending (1st = winner), score as tiebreaker
    results.sort((a, b) =>
      a.placement !== b.placement
        ? a.placement - b.placement
        : b.score - a.score,
    )

    const matchId = randomUUID()
    const matchResults = results.map((result) =>
      this.matchResultsRepository.create({
        matchId,
        roomId,
        userId: result.userId,
        placement: result.placement,
        score: result.score,
        lines: result.lines,
        state: session.players.get(result.userId)!.game.getState(),
      }),
    )

    let resultsSaved = false
    try {
      await this.matchResultsRepository.save(matchResults)
      resultsSaved = true
    } catch (error) {
      this.logger.error(`Failed to save results for match ${matchId}`, error)
    }

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
    pg.placement = session.nextPlacement--
    pg.game.gameOver = true
    this.retargetPlayersWhoTargeted(session, userId)

    this.emitToGameRoom(roomId, 'game.player-over', {
      roomId,
      userId,
      score: pg.game.getState().score,
      lines: pg.game.getState().lines,
      level: pg.game.getState().level,
    })

    this.checkGameEndCondition(roomId)
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
