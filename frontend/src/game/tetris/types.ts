/** Mirrors backend tetris types for the frontend renderer */

export enum TetrominoType {
  I = 'I',
  O = 'O',
  T = 'T',
  S = 'S',
  Z = 'Z',
  J = 'J',
  L = 'L',
}

export type Block = [number, number]

export type InputAction =
  | 'left'
  | 'right'
  | 'rotateCW'
  | 'rotateCCW'
  | 'rotate180'
  | 'softDrop'
  | 'hardDrop'
  | 'hold'

export interface TetrisPiece {
  type: TetrominoType
  row: number
  col: number
  rotation: number
}

export interface TetrisState {
  board: (string | 0)[][]
  currentPiece: TetrisPiece
  nextPiece: TetrominoType
  nextPieces: TetrominoType[]
  heldPiece: TetrominoType | null
  canHold: boolean
  ghostRow: number
  score: number
  lines: number
  level: number
  gameOver: boolean
}

export const BOARD_ROWS = 20
export const BOARD_COLS = 10

/**
 * Rotation states for each tetromino (same as backend).
 */
export const TETROMINOES: Record<TetrominoType, Block[][]> = {
  [TetrominoType.I]: [
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    [
      [-1, 1],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, -1],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  ],
  [TetrominoType.O]: [
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  ],
  [TetrominoType.T]: [
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [-1, 0],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [0, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [1, 0],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [0, -1],
    ],
  ],
  [TetrominoType.S]: [
    [
      [0, -1],
      [0, 0],
      [-1, 0],
      [-1, 1],
    ],
    [
      [-1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [-1, 0],
      [-1, 1],
    ],
    [
      [-1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
  ],
  [TetrominoType.Z]: [
    [
      [-1, -1],
      [-1, 0],
      [0, 0],
      [0, 1],
    ],
    [
      [-1, 1],
      [0, 0],
      [0, 1],
      [1, 0],
    ],
    [
      [-1, -1],
      [-1, 0],
      [0, 0],
      [0, 1],
    ],
    [
      [-1, 1],
      [0, 0],
      [0, 1],
      [1, 0],
    ],
  ],
  [TetrominoType.J]: [
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [-1, -1],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [-1, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [1, -1],
    ],
  ],
  [TetrominoType.L]: [
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [-1, 1],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [1, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [1, -1],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [-1, -1],
    ],
  ],
}

/** Classic Tetris color palette per piece type */
export const PIECE_COLORS: Record<TetrominoType, [number, number, number]> = {
  [TetrominoType.I]: [0.0, 0.9, 0.9], // cyan
  [TetrominoType.O]: [0.9, 0.9, 0.0], // yellow
  [TetrominoType.T]: [0.6, 0.0, 0.8], // purple
  [TetrominoType.S]: [0.0, 0.9, 0.0], // green
  [TetrominoType.Z]: [0.9, 0.0, 0.0], // red
  [TetrominoType.J]: [0.0, 0.0, 0.9], // blue
  [TetrominoType.L]: [0.9, 0.5, 0.0], // orange
}
