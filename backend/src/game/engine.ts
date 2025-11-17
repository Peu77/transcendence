import { GameRoom, GameState, Ball, Player } from './types';

export class GameEngine {
  private static readonly GAME_WIDTH = 800;
  private static readonly GAME_HEIGHT = 600;
  private static readonly BALL_SPEED = 0.15;
  private static readonly PADDLE_HEIGHT = 80;
  private static readonly PADDLE_WIDTH = 30;
  private static readonly BALL_RADIUS = 10;
  private static readonly TARGET_FPS = 60;
  private static readonly FRAME_TIME = 1000 / GameEngine.TARGET_FPS;


  static createInitialGameState(): GameState {
    return {
      ball: {
        position: {
            x: GameEngine.GAME_WIDTH / 2,
            y: GameEngine.GAME_HEIGHT / 2
        },
        velocity: {
            x: GameEngine.BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
            y: GameEngine.BALL_SPEED * (Math.random() > 0.5 ? 1 : -1)
        },
        radius: GameEngine.BALL_RADIUS
      },
      paddles: {},
      scores: {},
      gameWidth: GameEngine.GAME_WIDTH,
      gameHeight: GameEngine.GAME_HEIGHT,
      isPlaying: false
    };
  }

  static updateGameState(room: GameRoom): void {
    if (!room.gameState.isPlaying || room.players.size < 2) {
      return;
    }

    const { ball, gameWidth, gameHeight } = room.gameState;
    const now = Date.now();
    const deltaTime = now - room.lastUpdate;
    const normalizedDelta = deltaTime / GameEngine.FRAME_TIME;

    ball.position.x += ball.velocity.x * normalizedDelta;
    ball.position.y += ball.velocity.y * normalizedDelta;

    if (ball.position.y <= ball.radius || ball.position.y >= gameHeight - ball.radius) {
      ball.velocity.y = -ball.velocity.y;
      ball.position.y = Math.max(ball.radius, Math.min(gameHeight - ball.radius, ball.position.y));
    }

    const players = Array.from(room.players.values());
    
    if (room.type === '1v1' && players.length === 2) {
      this.handlePaddleCollisions1v1(ball, players, room.gameState);
    }
    // } else if (room.type === 'multiplayer') {
    //   this.handlePaddleCollisionsMultiplayer(ball, players, room.gameState);
    // }

    if (ball.position.x <= 0 || ball.position.x >= gameWidth) {
      this.handleScoring(room, ball.position.x <= 0 ? 'right' : 'left');
    }

    room.lastUpdate = now;
  }

  private static handlePaddleCollisions1v1(ball: Ball, players: Player[], gameState: GameState): void {
    const leftPlayer = players[0];
    const rightPlayer = players[1];
    
    const leftPaddle = gameState.paddles[leftPlayer.id];
    const rightPaddle = gameState.paddles[rightPlayer.id];

    if (!leftPaddle || !rightPaddle) return;


    if (ball.position.x <= leftPaddle.position.x + leftPaddle.width && 
        ball.velocity.x < 0 && 
        ball.position.y >= leftPaddle.position.y && 
        ball.position.y <= leftPaddle.position.y + leftPaddle.height) {
      ball.velocity.x = -ball.velocity.x;
      ball.position.x = leftPaddle.position.x + leftPaddle.width;
    }


    if (ball.position.x >= rightPaddle.position.x && 
        ball.velocity.x > 0 && 
        ball.position.y >= rightPaddle.position.y && 
        ball.position.y <= rightPaddle.position.y + rightPaddle.height) {
      ball.velocity.x = -ball.velocity.x;
      ball.position.x = rightPaddle.position.x;
    }
  }

//   private static handlePaddleCollisionsMultiplayer(ball: Ball, players: Player[], gameState: GameState): void {
//     // For multiplayer, implement collision logic for multiple paddles
//     // This is a simplified version - you can expand based on your game design
//     for (const player of players) {
//       const paddle = gameState.paddles[player.id];
//       if (!paddle) continue;

//       const distance = Math.sqrt(
//         Math.pow(ball.position.x - (paddle.position.x + paddle.width / 2), 2) +
//         Math.pow(ball.position.y - (paddle.position.y + paddle.height / 2), 2)
//       );

//       if (distance <= ball.radius + paddle.width / 2) {
//         // Simple bounce logic - can be improved
//         ball.velocity.x = -ball.velocity.x;
//         ball.velocity.y = -ball.velocity.y;
//       }
//     }
//   }

  private static handleScoring(room: GameRoom, scorer: 'left' | 'right'): void {
    const players = Array.from(room.players.values());
    
    if (room.type === '1v1' && players.length === 2) {
      const scoringPlayer = scorer === 'left' ? players[0] : players[1];
      room.gameState.scores[scoringPlayer.id]++;
      scoringPlayer.score++;

      if (scoringPlayer.score >= 5) {
        room.gameState.isPlaying = false;
        room.gameState.winner = scoringPlayer.id;
        room.endedAt = new Date();
        if (room.gameLoop) {
          clearInterval(room.gameLoop);
          room.gameLoop = undefined;
        }
      } else {
        this.resetBall(room.gameState.ball);
      }
    }
  }

  private static resetBall(ball: Ball): void {
    ball.position.x = GameEngine.GAME_WIDTH / 2;
    ball.position.y = GameEngine.GAME_HEIGHT / 2;
    ball.velocity.x = GameEngine.BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ball.velocity.y = GameEngine.BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
  }

  static createPaddle(playerId: string, room: GameRoom): void {
    const players = Array.from(room.players.values());
    const playerIndex = players.findIndex(p => p.id === playerId);
    
    if (room.type === '1v1') {
      if (playerIndex === 0) {
        room.gameState.paddles[playerId] = {
          position: {
            x: 10,
            y: GameEngine.GAME_HEIGHT / 2 - GameEngine.PADDLE_HEIGHT / 2
          },
          height: GameEngine.PADDLE_HEIGHT,
          width: GameEngine.PADDLE_WIDTH
        };
      } else if (playerIndex === 1) {
        room.gameState.paddles[playerId] = {
          position: {
            x: GameEngine.GAME_WIDTH - GameEngine.PADDLE_WIDTH - 10,
            y: GameEngine.GAME_HEIGHT / 2 - GameEngine.PADDLE_HEIGHT / 2
          },
          height: GameEngine.PADDLE_HEIGHT,
          width: GameEngine.PADDLE_WIDTH
        };
      }
    }
    // } else if (room.type === 'multiplayer') {
    //   // Position paddles around the perimeter for multiplayer
    //   const angle = (playerIndex * 2 * Math.PI) / room.maxPlayers;
    //   const radius = Math.min(GameEngine.GAME_WIDTH, GameEngine.GAME_HEIGHT) / 3;
    //   room.gameState.paddles[playerId] = {
    //     position: {
    //       x: GameEngine.GAME_WIDTH / 2 + radius * Math.cos(angle) - GameEngine.PADDLE_WIDTH / 2,
    //       y: GameEngine.GAME_HEIGHT / 2 + radius * Math.sin(angle) - GameEngine.PADDLE_HEIGHT / 2
    //     },
    //     height: GameEngine.PADDLE_HEIGHT,
    //     width: GameEngine.PADDLE_WIDTH
    //   };
    // }

    room.gameState.scores[playerId] = 0;
  }

  static updatePaddle(playerId: string, newY: number, room: GameRoom): void {
    const paddle = room.gameState.paddles[playerId];
    if (paddle) {
      paddle.position.y = Math.max(0, Math.min(GameEngine.GAME_HEIGHT - paddle.height, newY));
    }
  }
}
