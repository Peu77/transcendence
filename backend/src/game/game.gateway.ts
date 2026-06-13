import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import type { Server } from 'socket.io'

/**
 * Legacy game gateway — game logic has moved to RealtimeGateway.
 * Keep this in here because it's referenced in the frontend. @emil @charlotte  backend/src/realtime/realtime.gateway.ts
 */
@WebSocketGateway({
  namespace: '/game',
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'https://localhost:8443',
    credentials: true,
  },
})
export class GameGateway {
  @WebSocketServer()
  server!: Server
}
