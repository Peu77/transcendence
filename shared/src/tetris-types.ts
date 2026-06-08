export enum TetrominoType {
  I = 'I',
  O = 'O',
  T = 'T',
  S = 'S',
  Z = 'Z',
  J = 'J',
  L = 'L',
}

/** A 2D coordinate offset [row, col] relative to the piece origin. */
export type Block = [number, number]

export type InputAction =
  | 'left'
  | 'right'
  | 'rotate'
  | 'rotateCcw'
  | 'rotate180'
  | 'softDrop'
  | 'hardDrop'
  | 'hold'

export interface TetrisPiece {
  type: TetrominoType
  /** row, col of the piece origin on the board */
  row: number
  col: number
  /** current rotation index (0-3) */
  rotation: number
}

/**
 * Cumulative gameplay counters for a single game, tracked by the engine.
 *
 * This is intentionally an open-ended "bag of counters". To track a new
 * gameplay metric (e.g. t-spins, perfect clears, attack sent), add a field
 * here, increment it in the relevant spot of `TetrisGame`, and it will flow
 * through `getState()` -> persisted `MatchResult.state` -> aggregated user
 * stats automatically, without any schema migration.
 */
export interface GameMetrics {
  /** Total pieces locked into the board. */
  piecesPlaced: number
  /** Number of 1-line clears. */
  singles: number
  /** Number of 2-line clears. */
  doubles: number
  /** Number of 3-line clears. */
  triples: number
  /** Number of 4-line clears (tetrises). */
  tetrises: number
  /** Highest combo chain reached this game. */
  maxCombo: number
  /** Number of times the hold slot was used. */
  holds: number
  // Future extensions (require detection in the engine first), e.g.:
  // tSpins: number
  // perfectClears: number
}

export function createEmptyGameMetrics(): GameMetrics {
  return {
    piecesPlaced: 0,
    singles: 0,
    doubles: 0,
    triples: 0,
    tetrises: 0,
    maxCombo: 0,
    holds: 0,
  }
}

export interface TetrisState {
  /** 20 rows x 10 cols.  0 = empty, otherwise a TetrominoType char code */
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
  metrics: GameMetrics
}

export const BOARD_ROWS = 20
export const BOARD_COLS = 10

/**
 * Rotation states for each tetromino.
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
