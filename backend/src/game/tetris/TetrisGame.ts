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
import {
  GarbageCancel,
  type MatchSettings,
  PieceRandomizer,
  RotationSystem,
} from '../../room/types'

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

type PendingGarbage = {
  lines: number
  applyAt: number
}

export class TetrisGame {
  private readonly settings: MatchSettings
  board: (string | 0)[][]
  currentPiece: TetrisPiece
  nextType: TetrominoType
  nextTypes: TetrominoType[] = []
  heldType: TetrominoType | null = null
  canHold = true
  score = 0
  lines = 0
  level = 1
  gameOver = false
  private combo = -1
  private backToBack = false
  private outgoingGarbage = 0
  private pendingGarbage: PendingGarbage[] = []
  private garbageHoleCol = -1
  private lockDelayStart: number | null = null
  private lockResetCount = 0

  constructor(settings: Partial<MatchSettings> = {}) {
    this.settings = this.createSettings(settings)
    this.board = this.createEmptyBoard()
    this.refillNextTypes()
    this.currentPiece = this.spawnPiece(this.takeNextType(true))
    this.nextType = this.nextTypes[0]
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
      this.lockDelayStart = null
    } else {
      if (this.lockDelayStart === null) {
        this.lockDelayStart = Date.now()
      } else if (Date.now() - this.lockDelayStart >= this.settings.lockDelayMs) {
        if (!this.lockAndSpawn()) return false
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
          if (this.tryResetLockDelay()) this.lockAndSpawn()
        }
        break

      case 'right':
        if (this.canMove(this.currentPiece, 0, 1)) {
          this.currentPiece.col += 1
          if (this.tryResetLockDelay()) this.lockAndSpawn()
        }
        break

      case 'rotateCW':
        if (this.tryRotate(1) && this.tryResetLockDelay()) this.lockAndSpawn()
        break

      case 'rotateCCW':
        if (this.tryRotate(-1) && this.tryResetLockDelay()) this.lockAndSpawn()
        break

      case 'rotate180':
        if (this.tryRotate(2) && this.tryResetLockDelay()) this.lockAndSpawn()
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

      case 'hold':
        this.holdPiece()
        break
    }
  }

  collectOutgoingGarbage(): number {
    const garbage = this.outgoingGarbage
    this.outgoingGarbage = 0
    return garbage
  }

  receiveGarbage(lines: number): void {
    if (!this.settings.garbage.enabled || this.gameOver) return

    const amount = Math.max(0, Math.floor(lines))
    if (amount === 0) return

    this.pendingGarbage.push({
      lines: amount,
      applyAt: Date.now() + Math.max(0, this.settings.garbage.delayMs),
    })
  }

  getState(): TetrisState {
    return {
      board: this.board,
      currentPiece: { ...this.currentPiece },
      nextPiece: this.nextType,
      nextPieces: this.nextTypes.slice(0, this.settings.nextCount),
      heldPiece: this.heldType,
      canHold: this.settings.hold && this.canHold,
      ghostRow: this.computeGhostRow(),
      score: this.score,
      lines: this.lines,
      level: this.level,
      gameOver: this.gameOver,
    }
  }

  /** Milliseconds between gravity ticks for the current level. */
  getTickInterval(): number {
    if (this.settings.gravity >= 20) return 1
    if (this.settings.gravity > 0 && this.settings.gravity !== 1) {
      return Math.max(1, Math.round(1000 / this.settings.gravity))
    }
    // Starts at 800 ms, decreases per level down to a minimum of 100 ms.
    return Math.max(100, 800 - (this.level - 1) * 70)
  }

  /* ------------------------------------------------------------------ */
  /*  Internal helpers                                                   */
  /* ------------------------------------------------------------------ */

  private createEmptyBoard(): (string | 0)[][] {
    return Array.from({ length: this.totalRows }, () =>
      Array.from<string | 0>({ length: this.settings.width }).fill(0),
    )
  }

  private createSettings(settings: Partial<MatchSettings>): MatchSettings {
    return {
      gravity: 1,
      lockDelayMs: 500,
      lockResetLimit: 15,
      areMs: 0,
      lineClearDelayMs: 500,
      rotationSystem: RotationSystem.SRS,
      hold: true,
      nextCount: 5,
      bag: PieceRandomizer.SEVEN_BAG,
      forbidInitialSZ: false,
      width: BOARD_COLS,
      height: BOARD_ROWS,
      hiddenRows: 0,
      ...settings,
      garbage: {
        enabled: settings.garbage?.enabled ?? true,
        delayMs: settings.garbage?.delayMs ?? 1000,
        cancel: settings.garbage?.cancel ?? GarbageCancel.PARTIAL,
        holeCount: settings.garbage?.holeCount ?? 1,
        messiness: settings.garbage?.messiness ?? 0.42,
      },
      damage: {
        table: {
          single: settings.damage?.table?.single ?? 1,
          double: settings.damage?.table?.double ?? 2,
          triple: settings.damage?.table?.triple ?? 3,
          tetris: settings.damage?.table?.tetris ?? 4,
          tSpinSingle: settings.damage?.table?.tSpinSingle ?? 2,
          tSpinDouble: settings.damage?.table?.tSpinDouble ?? 4,
          tSpinTriple: settings.damage?.table?.tSpinTriple ?? 6,
        },
        comboMultiplier: settings.damage?.comboMultiplier ?? 1.5,
        backToBackMultiplier: settings.damage?.backToBackMultiplier ?? 1.5,
      },
    }
  }

  private get totalRows(): number {
    return this.settings.height + this.settings.hiddenRows
  }

  private randomType(): TetrominoType {
    return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]
  }

  private randomBag(): TetrominoType[] {
    const bag = [...PIECE_TYPES]
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[bag[i], bag[j]] = [bag[j], bag[i]]
    }
    return bag
  }

  private refillNextTypes(): void {
    const minimumSize = Math.max(this.settings.nextCount + 1, 1)
    while (this.nextTypes.length < minimumSize) {
      this.nextTypes.push(
        ...(this.settings.bag === PieceRandomizer.SEVEN_BAG
          ? this.randomBag()
          : [this.randomType()]),
      )
    }
  }

  private takeNextType(isInitial = false): TetrominoType {
    this.refillNextTypes()
    let type = this.nextTypes.shift()!
    if (
      isInitial &&
      this.settings.forbidInitialSZ &&
      (type === TetrominoType.S || type === TetrominoType.Z)
    ) {
      const replacementIndex = this.nextTypes.findIndex(
        (nextType) =>
          nextType !== TetrominoType.S && nextType !== TetrominoType.Z,
      )
      if (replacementIndex >= 0) {
        const replacement = this.nextTypes.splice(replacementIndex, 1)[0]
        this.nextTypes.push(type)
        type = replacement
      }
    }
    this.refillNextTypes()
    this.nextType = this.nextTypes[0]
    return type
  }

  private spawnPiece(type: TetrominoType): TetrisPiece {
    return {
      type,
      row: 0,
      col: Math.floor(this.settings.width / 2) - 1,
      rotation: 0,
    }
  }

  private spawn(): boolean {
    this.currentPiece = this.spawnPiece(this.takeNextType())
    this.canHold = true
    this.lockDelayStart = null
    this.lockResetCount = 0

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
      if (r >= this.totalRows || c < 0 || c >= this.settings.width) return false
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
      if (r >= this.totalRows || c < 0 || c >= this.settings.width) return true
      if (r >= 0 && this.board[r][c] !== 0) return true
    }
    return false
  }

  private lockPiece(): void {
    const blocks = this.getBlocks(this.currentPiece)
    for (const [br, bc] of blocks) {
      const r = this.currentPiece.row + br
      const c = this.currentPiece.col + bc
      if (r >= 0 && r < this.totalRows && c >= 0 && c < this.settings.width) {
        this.board[r][c] = this.currentPiece.type
      }
    }
  }

  private clearLines(): void {
    let cleared = 0
    for (let r = this.totalRows - 1; r >= 0; r--) {
      if (this.board[r].every((cell) => cell !== 0)) {
        this.board.splice(r, 1)
        this.board.unshift(
          Array.from<string | 0>({ length: this.settings.width }).fill(0),
        )
        cleared++
        r++
      }
    }

    if (cleared > 0) {
      this.combo++
      this.lines += cleared
      this.score += (LINE_SCORES[cleared] ?? cleared * 200) * this.level
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1
      this.outgoingGarbage += this.calculateGarbage(cleared)
    } else {
      this.combo = -1
      this.backToBack = false
    }
  }

  private calculateGarbage(cleared: number): number {
    if (!this.settings.garbage.enabled) return 0

    const table = this.settings.damage.table
    const baseDamage =
      cleared === 1
        ? table.single
        : cleared === 2
          ? table.double
          : cleared === 3
            ? table.triple
            : table.tetris
    const isBackToBackClear = cleared === 4
    const backToBackBonus =
      isBackToBackClear && this.backToBack
        ? Math.floor(
            baseDamage * (this.settings.damage.backToBackMultiplier - 1),
          )
        : 0
    const comboBonus = Math.floor(
      Math.max(0, this.combo) * this.settings.damage.comboMultiplier,
    )
    const damage = baseDamage + backToBackBonus + comboBonus

    this.backToBack = isBackToBackClear
    return this.cancelPendingGarbage(Math.max(0, Math.floor(damage)))
  }

  private cancelPendingGarbage(lines: number): number {
    if (lines === 0 || this.settings.garbage.cancel === GarbageCancel.NONE) {
      return lines
    }

    const queued = this.pendingGarbage.reduce(
      (sum, item) => sum + item.lines,
      0,
    )
    if (queued === 0) return lines

    if (this.settings.garbage.cancel === GarbageCancel.FULL) {
      this.pendingGarbage = []
      return Math.max(0, lines - queued)
    }

    let remainingAttack = lines
    const remainingQueue: PendingGarbage[] = []
    for (const item of this.pendingGarbage) {
      if (remainingAttack >= item.lines) {
        remainingAttack -= item.lines
      } else {
        remainingQueue.push({ ...item, lines: item.lines - remainingAttack })
        remainingAttack = 0
      }
    }
    this.pendingGarbage = remainingQueue
    return remainingAttack
  }

  private applyDueGarbage(): void {
    if (!this.settings.garbage.enabled || this.pendingGarbage.length === 0) {
      return
    }

    const now = Date.now()
    let lines = 0
    this.pendingGarbage = this.pendingGarbage.filter((item) => {
      if (item.applyAt > now) return true
      lines += item.lines
      return false
    })

    for (let i = 0; i < lines; i++) {
      this.addGarbageLine()
    }
  }

  private addGarbageLine(): void {
    const removedRow = this.board.shift()
    if (removedRow?.some((cell) => cell !== 0)) {
      this.gameOver = true
    }

    const holes = this.pickGarbageHoles()
    this.board.push(
      Array.from({ length: this.settings.width }, (_, col): string | 0 =>
        holes.has(col) ? 0 : 'G',
      ),
    )
  }

  private pickGarbageHoles(): Set<number> {
    const holeCount = Math.min(
      Math.max(1, Math.floor(this.settings.garbage.holeCount)),
      this.settings.width,
    )

    if (
      this.garbageHoleCol < 0 ||
      Math.random() < this.settings.garbage.messiness
    ) {
      this.garbageHoleCol = Math.floor(Math.random() * this.settings.width)
    }

    const holes = new Set<number>([this.garbageHoleCol])
    while (holes.size < holeCount) {
      holes.add(Math.floor(Math.random() * this.settings.width))
    }
    return holes
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
    this.applyDueGarbage()
    if (this.gameOver) return
    if (!this.spawn()) {
      log('GAME OVER after hard-drop: new piece collides at spawn', {
        piece: this.currentPiece,
        topRows: this.board.slice(0, 4),
      })
      this.gameOver = true
    }
  }

  private holdPiece(): void {
    if (!this.settings.hold || !this.canHold) return

    const currentType = this.currentPiece.type
    const nextType = this.heldType ?? this.takeNextType()
    this.heldType = currentType
    this.currentPiece = this.spawnPiece(nextType)
    this.canHold = false
    this.lockDelayStart = null
    this.lockResetCount = 0

    if (this.collides(this.currentPiece)) {
      log('GAME OVER after hold: held piece collides at spawn', {
        piece: this.currentPiece,
        topRows: this.board.slice(0, 4),
      })
      this.gameOver = true
    }
  }

  private readonly JLSTZ_KICKS: Record<string, Block[]> = {
    '0>1': [[0,0],[0,-1],[-1,-1],[2,0],[2,-1]],
    '1>2': [[0,0],[0,1],[1,1],[-2,0],[-2,1]],
    '2>3': [[0,0],[0,1],[-1,1],[2,0],[2,1]],
    '3>0': [[0,0],[0,-1],[1,-1],[-2,0],[-2,-1]],
    '1>0': [[0,0],[0,1],[1,1],[-2,0],[-2,1]],
    '2>1': [[0,0],[0,-1],[-1,-1],[2,0],[2,-1]],
    '3>2': [[0,0],[0,-1],[1,-1],[-2,0],[-2,-1]],
    '0>3': [[0,0],[0,1],[-1,1],[2,0],[2,1]],
  }

  private readonly I_KICKS: Record<string, Block[]> = {
    '0>1': [[0,0],[0,-2],[0,1],[1,-2],[-2,1]],
    '1>2': [[0,0],[0,-1],[0,2],[-2,-1],[1,2]],
    '2>3': [[0,0],[0,2],[0,-1],[-1,2],[2,-1]],
    '3>0': [[0,0],[0,1],[0,-2],[2,1],[-1,-2]],
    '1>0': [[0,0],[0,2],[0,-1],[-1,2],[2,-1]],
    '2>1': [[0,0],[0,1],[0,-2],[2,1],[-1,-2]],
    '3>2': [[0,0],[0,-2],[0,1],[1,-2],[-2,1]],
    '0>3': [[0,0],[0,-1],[0,2],[-2,-1],[1,2]],
  }

  private tryResetLockDelay(): boolean {
    if (this.lockDelayStart === null) {
      if (this.canMove(this.currentPiece, 1, 0)) return false
      this.lockDelayStart = Date.now()
    }
    if (this.lockResetCount < this.settings.lockResetLimit) {
      this.lockDelayStart = Date.now()
      this.lockResetCount++
      return this.lockResetCount >= this.settings.lockResetLimit
    }
    return true
  }

  private lockAndSpawn(): boolean {
    log(
      `Locking piece ${this.currentPiece.type} at row=${this.currentPiece.row} col=${this.currentPiece.col}`,
    )
    this.lockPiece()
    this.clearLines()
    this.applyDueGarbage()
    if (this.gameOver) return false
    if (!this.spawn()) {
      log('GAME OVER: new piece collides at spawn', {
        piece: this.currentPiece,
        topRows: this.board.slice(0, 4),
      })
      this.gameOver = true
      return false
    }
    return true
  }

  private getKickOffsets(type: TetrominoType, from: number, to: number): Block[] {
    if (type === TetrominoType.O) return [[0, 0]]
    const key = `${from}>${to}`
    if (type === TetrominoType.I) return this.I_KICKS[key] ?? [[0, 0]]
    return this.JLSTZ_KICKS[key] ?? [[0, 0]]
  }

  private tryRotate(delta: number): boolean {
    const piece = this.currentPiece

    if (Math.abs(delta) === 2) {
      const before = { row: piece.row, col: piece.col, rotation: piece.rotation }
      if (!this.tryRotate(1)) return false
      if (!this.tryRotate(1)) {
        piece.row = before.row
        piece.col = before.col
        piece.rotation = before.rotation
        return false
      }
      return true
    }

    const from = piece.rotation
    const to = (from + delta + 4) % 4
    const kicks = this.getKickOffsets(piece.type, from, to)

    for (const [dRow, dCol] of kicks) {
      const test: TetrisPiece = { ...piece, rotation: to, row: piece.row + dRow, col: piece.col + dCol }
      if (!this.collides(test)) {
        piece.rotation = to
        piece.row = test.row
        piece.col = test.col
        return true
      }
    }
    return false
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
