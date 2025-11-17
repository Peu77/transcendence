import { GameRoom, GameMessage, Player, CreateRoomRequest } from './types';
import { GameEngine } from './engine';

export class GameRoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private playerToRoom: Map<string, Player> = new Map();

  createRoom(request: CreateRoomRequest, creatorId?: string): GameRoom {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const maxPlayers = request.type === 'single' ? 1 : 
                      request.type === '1v1' ? 2 : 
                      request.maxPlayers || 5;

    const room: GameRoom = {
      id: roomId,
      type: request.type,
      maxPlayers,
      players: new Map(),
      adminId: creatorId || '',
      gameState: GameEngine.createInitialGameState(),
      createdAt: new Date(),
      lastUpdate: Date.now()
    };

    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, player: Player): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.players.size >= room.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    if (room.gameState.isPlaying) {
      return { success: false, error: 'Game already in progress' };
    }

   
    this.leaveRoom(player.id);

    room.players.set(player.id, player);
    this.playerToRoom.set(player.id, player);
    
    GameEngine.createPaddle(player.id, room);

    
    this.broadcastToRoom(roomId, {
      type: 'player_joined',
      roomId,
      playerId: player.id,
      data: {
        playerId: player.id,
        username: player.username,
        playerCount: room.players.size
      }
    });

    return { success: true };
  }

  leaveRoom(playerId: string): boolean {
    const roomId = this.playerToRoom.get(playerId)?.id;
    if (!roomId) return false;

    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

  
    if (player.ws && player.ws.readyState === 1) {
      player.ws.close();
    }

    room.players.delete(playerId);
    this.playerToRoom.delete(playerId);
    
  
    delete room.gameState.paddles[playerId];
    delete room.gameState.scores[playerId];

    if (room.gameState.isPlaying && room.players.size < 2) {
      this.stopGame(roomId);
    }

    this.broadcastToRoom(roomId, {
      type: 'player_left',
      roomId,
      playerId,
      data: {
        playerId,
        playerCount: room.players.size
      }
    });

    if (room.players.size === 0) {
      if (room.gameLoop) {
        clearInterval(room.gameLoop);
      }
      this.rooms.delete(roomId);
    }

    return true;
  }

  startGame(roomId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.players.size < 2 && room.type !== 'single') {
      return { success: false, error: 'Not enough players' };
    }

    if (room.gameState.isPlaying) {
      return { success: false, error: 'Game already in progress' };
    }

    const allReady = Array.from(room.players.values()).every(player => player.ready);
    if (!allReady && room.type !== 'single') {
      return { success: false, error: 'Not all players are ready' };
    }

    room.gameState.isPlaying = true;
    room.startedAt = new Date();
    room.lastUpdate = Date.now();

    room.gameLoop = setInterval(() => {
      GameEngine.updateGameState(room);
      this.broadcastGameState(roomId);
      
      if (!room.gameState.isPlaying) {
        this.stopGame(roomId);
      }
    }, 1000 / 60);

    this.broadcastToRoom(roomId, {
      type: 'game_start',
      roomId,
      data: { gameState: room.gameState }
    });

    return { success: true };
  }

  stopGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.gameState.isPlaying = false;
    room.endedAt = new Date();

    if (room.gameLoop) {
      clearInterval(room.gameLoop);
      room.gameLoop = undefined;
    }

    // Reset player ready states
    room.players.forEach(player => {
      player.ready = false;
    });

    this.broadcastToRoom(roomId, {
      type: 'game_end',
      roomId,
      data: {
        winner: room.gameState.winner,
        finalScores: room.gameState.scores,
        duration: room.startedAt ? Date.now() - room.startedAt.getTime() : 0
      }
    });
  }

  handlePlayerMessage(playerId: string, message: GameMessage): void {
    const roomId = this.playerToRoom.get(playerId)?.id;
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    switch (message.type) {
      case 'ready':
        player.ready = !player.ready;
        this.broadcastToRoom(roomId, {
          type: 'player_ready',
          roomId,
          playerId,
          data: { ready: player.ready }
        });
        break;

      case 'paddle_move':
        if (room.gameState.isPlaying && message.data?.paddleY !== undefined) {
          GameEngine.updatePaddle(playerId, message.data.paddleY, room);
        }
        break;

      case 'game_start':
        this.startGame(roomId);
        break;
    }
  }

  broadcastToRoom(roomId: string, message: GameMessage): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify({
      ...message,
      timestamp: Date.now()
    });

    room.players.forEach(player => {
      if (player.ws && player.ws.readyState === 1) {
        player.ws.send(messageStr);
      }
    });
  }

  private broadcastGameState(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    this.broadcastToRoom(roomId, {
      type: 'game_state',
      roomId,
      data: {
        ball: room.gameState.ball,
        paddles: room.gameState.paddles,
        scores: room.gameState.scores
      }
    });
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByPlayerId(playerId: string): GameRoom | undefined {
    const roomId = this.playerToRoom.get(playerId)?.id;
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  getActiveRooms(): GameRoom[] {
    return Array.from(this.rooms.values()).filter(room => 
      room.players.size > 0 && !room.endedAt
    );
  }

  getRoomStats(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: room.id,
      type: room.type,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      isPlaying: room.gameState.isPlaying,
      createdAt: room.createdAt,
      startedAt: room.startedAt,
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        username: p.username,
        score: p.score,
        ready: p.ready
      }))
    };
  }
}
