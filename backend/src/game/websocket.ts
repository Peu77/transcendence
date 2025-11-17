import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GameRoomManager } from './roomManager';
import { GameMessage, Player, CreateRoomRequest, CreateRoomResponse } from './types';

export class GameWebSocketHandler {
  private roomManager: GameRoomManager;

  constructor(roomManager: GameRoomManager) {
    this.roomManager = roomManager;
  }

  handleConnection(connection: any, request: FastifyRequest): void {

    const userId = (request as any).userId as string | undefined;
    const username = (request as any).username as string | undefined;

    if (!userId || !username) {
      console.log('Unauthorized WebSocket connection attempt');
      connection.socket.close(1008, 'Unauthorized');
      return;
    }

    const playerId = `player_${userId}_${Date.now()}`;
    let currentPlayer: Player | null = null;

    console.log(`WebSocket connected: ${username} (${playerId})`);

    connection.socket.on('message', (buffer: Buffer) => {
      try {
        const message: GameMessage = JSON.parse(buffer.toString());
        
        switch (message.type) {
          case 'join_room':
            if (!message.roomId) {
              this.sendError(connection, 'Room ID is required');
              return;
            }

            currentPlayer = {
              id: playerId,
              userId,
              username,
              ws: connection.socket,
              paddle: 
              {
                position: { x: 0, y: 0 },
                width: 10,
                height: 100
              },
              score: 0,
              ready: false
            };

            const joinResult = this.roomManager.joinRoom(message.roomId, currentPlayer);
            if (joinResult.success) {
              connection.socket.send(JSON.stringify({
                type: 'joined_room',
                roomId: message.roomId,
                playerId,
                data: this.roomManager.getRoomStats(message.roomId)
              }));
            } else {
              this.sendError(connection, joinResult.error || 'Failed to join room');
            }
            break;

          case 'leave_room':
            if (currentPlayer) {
              this.roomManager.leaveRoom(currentPlayer.id);
              currentPlayer = null;
            }
            break;

          default:
            if (currentPlayer) {
              this.roomManager.handlePlayerMessage(currentPlayer.id, message);
            } else {
              this.sendError(connection, 'Player not in a room');
            }
        }
      } catch (error) {
        console.error('WebSocket message handling error:', error);
        this.sendError(connection, 'Invalid message format');
      }
    });

    connection.socket.on('close', () => {
      console.log(`WebSocket disconnected: ${username} (${playerId})`);
      if (currentPlayer) {
        this.roomManager.leaveRoom(currentPlayer.id);
      }
    });

    connection.socket.on('error', (error: Error) => {
      console.error(`WebSocket error for ${username}:`, error);
    });

    connection.socket.send(JSON.stringify({
      type: 'connected',
      playerId,
      data: { message: 'Connected to game server' }
    }));
  }

  private sendError(connection: any, message: string): void {
    if (connection.socket.readyState === 1) { // WebSocket.OPEN
      connection.socket.send(JSON.stringify({
        type: 'error',
        data: { message },
        timestamp: Date.now()
      }));
    }
  }
}

export function registerGameWebSocket(app: FastifyInstance, roomManager: GameRoomManager): void {
  const wsHandler = new GameWebSocketHandler(roomManager);

  app.get('/game/ws', { websocket: true }, (connection, request) => {
    wsHandler.handleConnection(connection, request);
  });
}
