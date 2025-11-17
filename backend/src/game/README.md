# Game Server Architecture

This document explains the new modular game server architecture that separates WebSocket game logic from REST API endpoints.

## 🎯 Architecture Overview

The game server is split into two main layers:

1. **Real-time Game State** (WebSocket)
   - Ball position, paddle positions, collisions
   - Fast updates (~60 FPS)
   - Real-time communication between players

2. **Game Management** (REST API)
   - Room creation, player profiles, scores, matchmaking
   - Non-time-critical operations
   - Standard HTTP requests

```
┌─────────────┐
│  Fastify    │  <-- REST endpoints (HTTP)
│  Server     │
│  TypeScript │
└─────────────┘
       │
┌──────┴──────────────────────┐
│                             │
┌─────────────────┐    ┌───────────────┐
│ WebSocket Server│    │ REST Endpoints│
│ /game/ws        │    │ /game/rooms   │
│ Real-time       │    │ /game/stats   │
│ updates         │    │ /game/health  │
└─────────────────┘    └───────────────┘
       │
┌──────┴───────┐
│ Game Rooms   │
│ & Engine     │
└──────────────┘
```

## 📁 File Structure

```
src/game/
├── index.ts           # Main exports
├── types.ts           # TypeScript interfaces
├── engine.ts          # Game physics and logic
├── roomManager.ts     # Room and player management
├── websocket.ts       # WebSocket handler
├── routes.ts          # REST API routes
└── game.test.ts       # Unit tests
```

## 🚀 Key Components

### 1. GameRoomManager (`roomManager.ts`)
Manages game rooms and player sessions:

- Create/delete rooms
- Join/leave room functionality
- Player state management
- Game session lifecycle

### 2. GameEngine (`engine.ts`)
Handles game physics and state:

- Ball movement and collision detection
- Paddle positioning
- Score tracking
- Game loop (60 FPS)

### 3. WebSocket Handler (`websocket.ts`)
Real-time communication:

- Player connections
- Message routing
- Real-time game state broadcasting

### 4. REST API (`routes.ts`)
HTTP endpoints for non-critical operations:

- `POST /game/rooms` - Create new room
- `GET /game/rooms` - List active rooms
- `GET /game/rooms/:id` - Get room details
- `DELETE /game/rooms/:id` - Delete room
- `GET /game/stats` - Game statistics
- `GET /game/health` - Health check

## 🎮 Game Types Supported

1. **Single Player** (`single`)
   - Local game, no networking needed
   - For testing/practice

2. **1v1 Online** (`1v1`)
   - Two players via WebSocket
   - Classic ping pong

3. **Multiplayer** (`multiplayer`)
   - Up to 5 players
   - Paddles positioned around the perimeter
   - This is in process of development, still not ready

## 🔌 WebSocket API


### Message Format
```typescript
interface GameMessage {
  type: 'join_room' | 'leave_room' | 'ready' | 'paddle_move' | 'game_state' | 'game_start' | 'game_end' | 'player_joined' | 'player_left' | 'player_ready' | 'error';
  roomId?: string;
  playerId?: string;
  data?: any;
  timestamp?: number;
}
```

### Example Messages

**Join Room:**
```json
{
  "type": "join_room",
  "roomId": "room_123"
}
```

**Move Paddle:**
```json
{
  "type": "paddle_move",
  "data": { "paddleY": 150 }
}
```

**Ready for Game:**
```json
{
  "type": "ready"
}
```

## 🎯 Game Flow

1. **Client creates room** via REST API
2. **Players join room** via WebSocket
3. **Players mark ready** via WebSocket
4. **Game starts** automatically when all ready
5. **Real-time updates** via WebSocket (60 FPS)
6. **Game ends** when win condition met
7. **Results saved** (can be extended for persistence)


## 🔐 Authentication

The next step is setting up a middleware
- `request.userId` - User ID
- `request.username` - Username

## ⚡ Performance Considerations

- **Game Loop**: Runs at 60 FPS for smooth gameplay
- **WebSocket Broadcasting**: Only sends updates to room members
- **Memory Management**: Rooms auto-cleanup when empty
- **Connection Handling**: Proper cleanup on disconnect

## 🚀 Deployment Notes

- Use `NODE_ENV=production` for production
- Consider Redis for multi-server room management
- Monitor WebSocket connection counts
- Set up proper logging for game events

## 🔮 Future Extensions

- **Game History**: Persist game results to database
- **Spectator Mode**: Allow non-players to watch games
- **Tournaments**: Bracket-style competitions
- **AI Players**: Bot opponents for practice
- **Custom Game Modes**: Different physics/rules
