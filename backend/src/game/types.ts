// Game-related type definitions


// here I define the interfaces and types used across the game module

// I will have to export all of them for the use in the room manager, engine, and websocket modules

// information on what will be used
// WEBSOCKET - Player, GameState (because of ball position, paddles)
// ROUTES - CreateRoomRequest, CreateRoomResponse, because it will be responsible for creating rooms
// roomManager - GameRoom, Player, GameMessage, GameState (after creationg room, it will manage the state)
//  it wil also transmit GameMessage between players and for the state updates
// ENGINE - Ball, GameState (for updating the ball position and game logic), it will be used for the game logic, insttead of the frontend



export interface Paddle {
    position: { x: number; y: number };
    height: number;
    width: number;
}

export interface Player {
    id: string;
    userId: string;
    username: string;
    ws: any;
    paddle: Paddle;
    score: number;
    ready: boolean;
}


export interface Ball {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    radius: number;
}


export interface GameSettings {
    ballSpeed: number;
    paddleHeight: number;
    matchDuration: number;
}

export interface GameMetadata {
    status: "waiting" | "running" | "finished";
    settings: GameSettings;
    maxPlayers: number;
}

export interface GameState {
    ball: Ball;
    paddles: Record<string, Paddle>;
    scores: Record<string, number>;
    gameWidth: number;
    gameHeight: number;
    isPlaying: boolean;
    winner?: string;
}

// export interface Date {
//     toISOString(): string;
// }

export interface GameRoom {
    id: string;
    type: 'single' | '1v1' | 'multiplayer';
    maxPlayers: number;
    players: Map<string, Player>;
    adminId: string;
    gameState: GameState;
    createdAt: Date;
    startedAt?: Date;
    endedAt?: Date;
    lastUpdate: number;
    gameLoop?: NodeJS.Timeout;
}

export interface GameMessage {
    type: 'join_room' | 'leave_room' | 'ready' | 'paddle_move' | 'game_state' | 'game_start' | 'game_end' | 'player_joined' | 'player_left' | 'player_ready' | 'error';
    roomId?: string;
    playerId?: string;
    data?: any;
    timestamp?: number;
}

export interface CreateRoomRequest {
    type: 'single' | '1v1' | 'multiplayer';
    maxPlayers?: number;
}

export interface CreateRoomResponse {
    roomId: string;
    type: string;
    maxPlayers: number;
}
