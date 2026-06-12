import {
  type Block,
  BOARD_COLS,
  BOARD_ROWS,
  type InputAction,
  type TetrisPiece,
  type TetrisState,
  TETROMINOES,
  TetrominoType,
} from './tetris-types'
import {GarbageCancel, type MatchSettings, PieceRandomizer, RotationSystem,} from './match-settings'

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
    piecesPlaced = 0
  private combo = -1
  private backToBack = false
  private outgoingGarbage = 0
  private pendingGarbage: PendingGarbage[] = []
  private garbageHoleCol = -1
  private lockDelayStart: number | null = null
  private lockResetCount = 0
  private lastRotated = false
  private lastKickIndex = 0
  private b2bChain = 0
  private readonly gameStartTime = Date.now()
  private readonly rng: () => number

  constructor(settings: Partial<MatchSettings> = {}, seed?: number) {
    this.settings = this.createSettings(settings)
    this.rng = this.createRng(seed ?? Math.floor(Math.random() * 0xffffffff))
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
      this.lockResetCount = 0
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
          this.lastRotated = false
          if (this.tryResetLockDelay()) this.lockAndSpawn()
        }
        break

      case 'right':
        if (this.canMove(this.currentPiece, 0, 1)) {
          this.currentPiece.col += 1
          this.lastRotated = false
          if (this.tryResetLockDelay()) this.lockAndSpawn()
        }
        break

      case 'rotateCW':
        this.doRotate(1)
        break

      case 'rotateCCW':
        this.doRotate(-1)
        break

      case 'rotate180':
        this.doRotate(2)
        break

      case 'softDrop':
        if (this.canMove(this.currentPiece, 1, 0)) {
          this.currentPiece.row += 1
          this.lastRotated = false
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
      combo: this.combo,
      b2bChain: this.b2bChain,
        piecesPlaced: this.piecesPlaced,
    }
  }

  /** Overwrite all game state from a server-authoritative snapshot (for client-side reconciliation). */
  restoreFromState(state: TetrisState, extraNextTypes?: TetrominoType[]): void {
    this.board = state.board.map(row => [...row])
    this.currentPiece = { ...state.currentPiece }
    this.nextType = state.nextPiece
    this.nextTypes = [...state.nextPieces, ...(extraNextTypes ?? [])]
    this.heldType = state.heldPiece
    this.canHold = state.canHold
    this.score = state.score
    this.lines = state.lines
    this.level = state.level
    this.gameOver = state.gameOver
      this.piecesPlaced = state.piecesPlaced
    this.combo = state.combo
    this.b2bChain = state.b2bChain
    this.backToBack = state.b2bChain > 0
    this.outgoingGarbage = 0
    this.pendingGarbage = []
  }

  /** Extra next pieces beyond the visible preview, for client-side prediction. */
  getPredictionPieces(count: number): TetrominoType[] {
    return this.nextTypes.slice(this.settings.nextCount, this.settings.nextCount + count)
  }

  /** Milliseconds between gravity ticks for the current level or custom override. */
  getTickInterval(): number {
    const g = this.getEffectiveGravity()
    if (g >= 20) return 1
    if (g <= 0) return 60000
    // Use level-based curve only when gravity is default and gincrease is off.
    if (this.settings.gincrease === 0 && this.settings.gravity === 1) {
      return Math.max(100, 800 - (this.level - 1) * 70)
    }
    // G is cells per frame at 60 fps, so interval = (1000ms / 60) / G
    return Math.max(1, Math.round((1000 / 60) / g))
  }

  private getEffectiveGravity(): number {
    if (this.settings.gincrease === 0) return this.settings.gravity
    const elapsedSeconds = (Date.now() - this.gameStartTime) / 1000
    const marginSeconds = this.settings.gmargin / 60
    const increase = this.settings.gincrease * Math.max(0, elapsedSeconds - marginSeconds)
    return Math.min(20, this.settings.gravity + increase)
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
      gravity: 0.02,
      gincrease: 0.0025,
      gmargin: 3600,
      lockDelayMs: 300,
      lockResetLimit: 15,


      rotationSystem: RotationSystem.SRS,
      hold: true,
      nextCount: 5,
      bag: PieceRandomizer.SEVEN_BAG,
      forbidInitialSZ: false,
      width: BOARD_COLS,
      height: BOARD_ROWS,
      hiddenRows: 0,
      garbageTargetK: 5,
      ...settings,
      garbage: {
        enabled: settings.garbage?.enabled ?? true,
        delayMs: settings.garbage?.delayMs ?? 1000,
        cancel: settings.garbage?.cancel ?? GarbageCancel.PARTIAL,
        holeCount: settings.garbage?.holeCount ?? 1,
        messiness: settings.garbage?.messiness ?? 0,
      },
      damage: {
        table: {
          single: settings.damage?.table?.single ?? 0,
          double: settings.damage?.table?.double ?? 1,
          triple: settings.damage?.table?.triple ?? 2,
          tetris: settings.damage?.table?.tetris ?? 4,
          tSpinMiniSingle: settings.damage?.table?.tSpinMiniSingle ?? 0,
          tSpinMiniDouble: settings.damage?.table?.tSpinMiniDouble ?? 1,
          tSpinSingle: settings.damage?.table?.tSpinSingle ?? 2,
          tSpinDouble: settings.damage?.table?.tSpinDouble ?? 4,
          tSpinTriple: settings.damage?.table?.tSpinTriple ?? 6,
          allClear: settings.damage?.table?.allClear ?? 10,
        },
        comboTable: settings.damage?.comboTable ?? [0, 0, 1, 1, 1, 2, 2, 3, 3, 4],
        backToBackBonus: settings.damage?.backToBackBonus ?? 1,
        garbageCap: settings.damage?.garbageCap ?? 8,
      },
    }
  }

  private get totalRows(): number {
    return this.settings.height + this.settings.hiddenRows
  }

  private createRng(seed: number): () => number {
    let s = seed >>> 0
    return () => {
      s += 0x6d2b79f5
      let z = s
      z = Math.imul(z ^ (z >>> 15), z | 1)
      z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
      return ((z ^ (z >>> 14)) >>> 0) / 0x100000000
    }
  }

  private randomType(): TetrominoType {
    return PIECE_TYPES[Math.floor(this.rng() * PIECE_TYPES.length)]
  }

  private randomBag(): TetrominoType[] {
    const bag = [...PIECE_TYPES]
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1))
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
    this.lastRotated = false

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
      this.piecesPlaced++
  }

  private clearLines(): void {
    const tSpin = this.detectTSpin()

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
      const isAllClear = this.board.every((row) => row.every((cell) => cell === 0))
      this.outgoingGarbage += this.calculateGarbage(cleared, tSpin, isAllClear)
    } else {
      this.combo = -1
    }
  }

  private calculateGarbage(
    cleared: number,
    tSpin: 'tspin' | 'mini' | null,
    isAllClear: boolean,
  ): number {
    if (!this.settings.garbage.enabled) return 0

    const { table, comboTable, backToBackBonus, garbageCap } = this.settings.damage

    let baseDamage: number
    let isHardClear: boolean

    if (tSpin === 'tspin') {
      baseDamage =
        cleared === 1 ? table.tSpinSingle
        : cleared === 2 ? table.tSpinDouble
        : cleared >= 3 ? table.tSpinTriple
        : 0
      isHardClear = true
    } else if (tSpin === 'mini') {
      baseDamage = cleared === 1 ? table.tSpinMiniSingle : table.tSpinMiniDouble
      isHardClear = true
    } else {
      baseDamage =
        cleared === 1 ? table.single
        : cleared === 2 ? table.double
        : cleared === 3 ? table.triple
        : table.tetris
      isHardClear = cleared === 4
    }

    const b2bBonus = isHardClear && this.backToBack ? backToBackBonus : 0
    const comboBonus = comboTable[Math.min(this.combo, comboTable.length - 1)] ?? 0
    const allClearBonus = isAllClear ? table.allClear : 0

    if (isHardClear && this.backToBack) {
      this.b2bChain++
    } else if (!isHardClear) {
      this.b2bChain = 0
    }
    this.backToBack = isHardClear

    const raw = baseDamage + b2bBonus + comboBonus + allClearBonus
    return this.cancelPendingGarbage(Math.min(Math.max(0, raw), garbageCap))
  }


  private detectTSpin(): 'tspin' | 'mini' | null {
    if (this.currentPiece.type !== TetrominoType.T) return null
    if (!this.lastRotated) return null

    const { row, col, rotation } = this.currentPiece

    // 4 corners around T center
    const corners: [number, number][] = [
      [-1, -1], // 0 top-left
      [-1,  1], // 1 top-right
      [ 1, -1], // 2 bottom-left
      [ 1,  1], // 3 bottom-right
    ]

    const filled = corners.map(([dr, dc]) => {
      const r = row + dr
      const c = col + dc
      return (
        r < 0 ||
        r >= this.totalRows ||
        c < 0 ||
        c >= this.settings.width ||
        this.board[r][c] !== 0
      )
    })

    const filledCount = filled.filter(Boolean).length

    if (filledCount < 3) return null

    const frontPairs: Record<number, [number, number]> = {
      0: [0, 1],
      1: [1, 3],
      2: [2, 3],
      3: [0, 2],
    }

    const backPairs: Record<number, [number, number]> = {
      0: [2, 3],
      1: [0, 2],
      2: [0, 1],
      3: [1, 3],
    }

    const [fi, fj] = frontPairs[rotation] ?? [0, 1]
    const [bi, bj] = backPairs[rotation] ?? [2, 3]

    const frontBothFilled = filled[fi] && filled[fj]
    const backBothFilled = filled[bi] && filled[bj]

    const isMiniShape = !frontBothFilled

    if (!isMiniShape) {
      return 'tspin'
    }

    if (this.lastKickIndex === 4) {
      return 'tspin'
    }

    return 'mini'
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
    const due: PendingGarbage[] = []
    this.pendingGarbage = this.pendingGarbage.filter((item) => {
      if (item.applyAt > now) return true
      due.push(item)
      return false
    })

    for (const item of due) {
      this.garbageHoleCol = -1
      for (let i = 0; i < item.lines; i++) {
        this.addGarbageLine()
      }
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
    this.lastRotated = false

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
    // 180° entries — not part of SRS spec; custom extension for rotate180 input
    '0>2': [[0,0],[0,1],[0,-1],[-1,0],[1,0]],
    '1>3': [[0,0],[0,1],[0,-1],[-1,0],[1,0]],
    '2>0': [[0,0],[0,1],[0,-1],[-1,0],[1,0]],
    '3>1': [[0,0],[0,1],[0,-1],[-1,0],[1,0]],
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
    // 180° entries — not part of SRS spec; custom extension for rotate180 input
    '0>2': [[0,0],[0,1],[0,-1],[-1,0],[1,0]],
    '1>3': [[0,0],[0,1],[0,-1],[-1,0],[1,0]],
    '2>0': [[0,0],[0,1],[0,-1],[-1,0],[1,0]],
    '3>1': [[0,0],[0,1],[0,-1],[-1,0],[1,0]],
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
    if (this.canMove(this.currentPiece, 1, 0)) {
      this.lockDelayStart = null
      this.lockResetCount = 0
      return true
    }
    log(
      `Locking piece ${this.currentPiece.type} at row=${this.currentPiece.row} col=${this.currentPiece.col}`,
    )
    this.lockDelayStart = null
    this.lockResetCount = 0
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

  private doRotate(delta: number): void {
    if (!this.tryRotate(delta)) return
    if (this.tryResetLockDelay()) this.lockAndSpawn()
  }

  private tryRotate(delta: number): boolean {
    const piece = this.currentPiece

    const from = piece.rotation
    const to = (from + delta + 4) % 4
    const kicks = this.getKickOffsets(piece.type, from, to)

    for (let i = 0; i < kicks.length; i++) {
      const [dRow, dCol] = kicks[i]
      const test: TetrisPiece = { ...piece, rotation: to, row: piece.row + dRow, col: piece.col + dCol }
      if (!this.collides(test)) {
        piece.rotation = to
        piece.row = test.row
        piece.col = test.col
        this.lastRotated = true
        this.lastKickIndex = i
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
