import {
  type Block,
  BOARD_COLS,
  BOARD_ROWS,
  type InputAction,
  TETROMINOES,
  type TetrisPiece,
  type TetrisState,
  TetrominoType,
} from './tetris.types'

const PIECE_TYPES = Object.values(TetrominoType)

const log = (msg: string, data?: unknown) =>
  console.log(`[TetrisGame] ${msg}`, data ?? '')

const LINES_PER_LEVEL = 10

const LINE_SCORES: Record<number, number> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
}

export class TetrisGame {
  board: (string | 0)[][]
  currentPiece: TetrisPiece
  nextType: TetrominoType
  score = 0
  lines = 0
  level = 1
  gameOver = false

  constructor() {
    this.board = this.createEmptyBoard()
    this.nextType = this.randomType()
    this.currentPiece = this.spawnPiece(this.randomType())
    this.nextType = this.randomType()
    log(
      `Game created. First piece: ${this.currentPiece.type}, next: ${this.nextType}`,
    )
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  tick(): boolean {
    if (this.gameOver) return false

    if (this.canMove(this.currentPiece, 1, 0)) {
      this.currentPiece.row += 1
    } else {
      log(
        `Locking piece ${this.currentPiece.type} at row=${this.currentPiece.row} col=${this.currentPiece.col}`,
      )
      this.lockPiece()
      this.clearLines()
      if (!this.spawn()) {
        log('GAME OVER: new piece collides at spawn', {
          piece: this.currentPiece,
          topRows: this.board.slice(0, 4),
        })
        this.gameOver = true
        return false
      }
    }
    return true
  }

  /** Process a player input action. */
  processInput(action: InputAction): void {
    if (this.gameOver) return

    switch (action) {
      case 'left':
        if (this.canMove(this.currentPiece, 0, -1)) {
          this.currentPiece.col -= 1
        }
        break

      case 'right':
        if (this.canMove(this.currentPiece, 0, 1)) {
          this.currentPiece.col += 1
        }
        break

      case 'rotate':
        this.tryRotate()
        break

      case 'softDrop':
        if (this.canMove(this.currentPiece, 1, 0)) {
          this.currentPiece.row += 1
          this.score += 1
        }
        break

      case 'hardDrop':
        this.hardDrop()
        break
    }
  }

  getState(): TetrisState {
    return {
      board: this.board,
      currentPiece: { ...this.currentPiece },
      nextPiece: this.nextType,
      ghostRow: this.computeGhostRow(),
      score: this.score,
      lines: this.lines,
      level: this.level,
      gameOver: this.gameOver,
    }
  }

  /** Milliseconds between gravity ticks for the current level. */
  getTickInterval(): number {
    // Starts at 800 ms, decreases per level down to a minimum of 100 ms.
    return Math.max(100, 800 - (this.level - 1) * 70)
  }

  /* ------------------------------------------------------------------ */
  /*  Internal helpers                                                   */
  /* ------------------------------------------------------------------ */

  private createEmptyBoard(): (string | 0)[][] {
    return Array.from({ length: BOARD_ROWS }, () =>
      Array.from<string | 0>({ length: BOARD_COLS }).fill(0),
    )
  }

  private randomType(): TetrominoType {
    return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]
  }

  private spawnPiece(type: TetrominoType): TetrisPiece {
    return {
      type,
      row: 0,
      col: Math.floor(BOARD_COLS / 2) - 1,
      rotation: 0,
    }
  }

  private spawn(): boolean {
    this.currentPiece = this.spawnPiece(this.nextType)
    this.nextType = this.randomType()

    const blocked = this.collides(this.currentPiece)
    if (blocked) {
      const blocks = this.getBlocks(this.currentPiece)
      const absolutePositions = blocks.map(([br, bc]) => [
        this.currentPiece.row + br,
        this.currentPiece.col + bc,
      ])
      log(`Spawn BLOCKED for ${this.currentPiece.type}`, {
        spawnRow: this.currentPiece.row,
        spawnCol: this.currentPiece.col,
        absolutePositions,
      })
    } else {
      log(
        `Spawned ${this.currentPiece.type} at row=${this.currentPiece.row} col=${this.currentPiece.col}`,
      )
    }
    return !blocked
  }

  private getBlocks(piece: TetrisPiece): Block[] {
    return TETROMINOES[piece.type][piece.rotation]
  }

  private canMove(piece: TetrisPiece, dRow: number, dCol: number): boolean {
    const blocks = this.getBlocks(piece)
    for (const [br, bc] of blocks) {
      const r = piece.row + br + dRow
      const c = piece.col + bc + dCol
      if (r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) return false
      if (r >= 0 && this.board[r][c] !== 0) return false
    }
    return true
  }

  private collides(piece: TetrisPiece): boolean {
    const blocks = this.getBlocks(piece)
    for (const [br, bc] of blocks) {
      const r = piece.row + br
      const c = piece.col + bc
      // Allow blocks above the board (r < 0) -- standard Tetris spawning zone
      if (r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) return true
      if (r >= 0 && this.board[r][c] !== 0) return true
    }
    return false
  }

  private lockPiece(): void {
    const blocks = this.getBlocks(this.currentPiece)
    for (const [br, bc] of blocks) {
      const r = this.currentPiece.row + br
      const c = this.currentPiece.col + bc
      if (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS) {
        this.board[r][c] = this.currentPiece.type
      }
    }
  }

  private clearLines(): void {
    let cleared = 0
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      if (this.board[r].every((cell) => cell !== 0)) {
        this.board.splice(r, 1)
        this.board.unshift(
          Array.from<string | 0>({ length: BOARD_COLS }).fill(0),
        )
        cleared++
        r++
      }
    }

    if (cleared > 0) {
      this.lines += cleared
      this.score += (LINE_SCORES[cleared] ?? cleared * 200) * this.level
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1
    }
  }

  private hardDrop(): void {
    let dropRows = 0
    while (this.canMove(this.currentPiece, dropRows + 1, 0)) {
      dropRows++
    }
    this.currentPiece.row += dropRows
    this.score += dropRows * 2
    log(
      `Hard-drop piece ${this.currentPiece.type} to row=${this.currentPiece.row}`,
    )
    this.lockPiece()
    this.clearLines()
    if (!this.spawn()) {
      log('GAME OVER after hard-drop: new piece collides at spawn', {
        piece: this.currentPiece,
        topRows: this.board.slice(0, 4),
      })
      this.gameOver = true
    }
  }

  private tryRotate(): void {
    const piece = this.currentPiece
    const nextRotation = (piece.rotation + 1) % 4
    const test: TetrisPiece = { ...piece, rotation: nextRotation }

    for (const kick of [0, -1, 1, -2, 2]) {
      test.col = piece.col + kick
      if (!this.collides(test)) {
        this.currentPiece.rotation = nextRotation
        this.currentPiece.col = test.col
        return
      }
    }
  }

  /** Compute the ghost piece row (where hard-drop would land). */
  private computeGhostRow(): number {
    let dropRows = 0
    while (this.canMove(this.currentPiece, dropRows + 1, 0)) {
      dropRows++
    }
    return this.currentPiece.row + dropRows
  }
}
