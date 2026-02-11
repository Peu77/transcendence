import {
  type Block,
  BOARD_COLS,
  BOARD_ROWS,
  type InputAction,
  TETROMINOES,
  type TetrisPiece,
  type TetrisState,
  TetrominoType,
} from "./tetris.types";

const PIECE_TYPES = Object.values(TetrominoType);

const log = (msg: string, data?: unknown) =>
  console.log(`[TetrisGame] ${msg}`, data ?? "");

const LINES_PER_LEVEL = 10;

const LINE_SCORES: Record<number, number> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

export class TetrisGame {
  board: (string | 0)[][];
  currentPiece: TetrisPiece;
  nextType: TetrominoType;
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;
  paused = false;

  constructor() {
    this.board = this.createEmptyBoard();
    this.nextType = this.randomType();
    this.currentPiece = this.spawnPiece(this.randomType());
    this.nextType = this.randomType();
    log(`Game created. First piece: ${this.currentPiece.type}, next: ${this.nextType}`);
  }

  
}
