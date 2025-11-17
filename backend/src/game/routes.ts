import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GameRoomManager } from './roomManager';
import { CreateRoomRequest, CreateRoomResponse } from './types';

interface CreateRoomBody {
  type: 'single' | '1v1' | 'multiplayer';
  maxPlayers?: number;
}

interface RoomStatsParams {
  roomId: string;
}


export function registerGameRoutes(app: FastifyInstance, roomManager: GameRoomManager): void {
  
  app.post<{ Body: CreateRoomBody; Reply: CreateRoomResponse }>(
    '/game/rooms',
    {
      schema: {
        body: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { 
              type: 'string', 
              enum: ['single', '1v1', 'multiplayer'] 
            },
            maxPlayers: { 
              type: 'number', 
              minimum: 2, 
              maximum: 5 
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              roomId: { type: 'string' },
              type: { type: 'string' },
              maxPlayers: { type: 'number' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateRoomBody }>, reply: FastifyReply) => {
      const { type, maxPlayers } = request.body;
      const userId = (request as any).userId as string;

      try {
        const room = roomManager.createRoom({ type, maxPlayers }, userId);
        
        reply.send({
          roomId: room.id,
          type: room.type,
          maxPlayers: room.maxPlayers
        });
      } catch (error) {
        reply.status(500).send({ 
          error: 'Failed to create room',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  app.get('/game/rooms', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const activeRooms = roomManager.getActiveRooms().map(room => ({
        id: room.id,
        type: room.type,
        playerCount: room.players.size,
        maxPlayers: room.maxPlayers,
        isPlaying: room.gameState.isPlaying,
        createdAt: room.createdAt
      }));

      reply.send({ rooms: activeRooms });
    } catch (error) {
      reply.status(500).send({ 
        error: 'Failed to fetch rooms',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get<{ Params: RoomStatsParams }>(
    '/game/rooms/:roomId',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            roomId: { type: 'string' }
          },
          required: ['roomId']
        }
      }
    },
    async (request: FastifyRequest<{ Params: RoomStatsParams }>, reply: FastifyReply) => {
      const { roomId } = request.params;

      try {
        const roomStats = roomManager.getRoomStats(roomId);
        
        if (!roomStats) {
          return reply.status(404).send({ 
            error: 'Room not found' 
          });
        }

        reply.send(roomStats);
      } catch (error) {
        reply.status(500).send({ 
          error: 'Failed to fetch room details',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  app.delete<{ Params: RoomStatsParams }>(
    '/game/rooms/:roomId',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            roomId: { type: 'string' }
          },
          required: ['roomId']
        }
      }
    },
    async (request: FastifyRequest<{ Params: RoomStatsParams }>, reply: FastifyReply) => {
      const { roomId } = request.params;
      const userId = (request as any).userId as string;

      try {
        const room = roomManager.getRoom(roomId);
        
        if (!room) {
          return reply.status(404).send({ 
            error: 'Room not found' 
          });
        }

         if (room.adminId !== userId) {
          return reply.status(403).send({ 
            error: 'Only the room admin can delete the room' 
          });
        }

        if (room.players.size > 0 && room.gameState.isPlaying) {
          return reply.status(400).send({ 
            error: 'Cannot delete room with active game' 
          });
        }

        const playerIds = Array.from(room.players.keys());
        playerIds.forEach(playerId => {
          roomManager.leaveRoom(playerId);
        });

        reply.send({ message: 'Room deleted successfully' });
      } catch (error) {
        reply.status(500).send({ 
          error: 'Failed to delete room',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );


  app.get('/game/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const allRooms = roomManager.getAllRooms();
      const activeRooms = roomManager.getActiveRooms();
      
      const stats = {
        totalRooms: allRooms.length,
        activeRooms: activeRooms.length,
        totalPlayers: activeRooms.reduce((sum, room) => sum + room.players.size, 0),
        gamesInProgress: activeRooms.filter(room => room.gameState.isPlaying).length,
        roomTypes: {
          single: activeRooms.filter(room => room.type === 'single').length,
          '1v1': activeRooms.filter(room => room.type === '1v1').length,
          multiplayer: activeRooms.filter(room => room.type === 'multiplayer').length
        }
      };

      reply.send(stats);
    } catch (error) {
      reply.status(500).send({ 
        error: 'Failed to fetch game statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/game/health', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
}
