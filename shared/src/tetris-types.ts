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
  | 'rotateCW'
  | 'rotateCCW'
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
  /** Current combo count. 0 = first clear, 1 = second consecutive, etc. -1 when no combo active. */
  combo: number
  /** Number of consecutive hard clears (Tetris / T-Spin). 0 = B2B not active, 1+ = B2B active. */
  b2bChain: number
    /** Total number of pieces locked onto the board. */
    piecesPlaced: number
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
