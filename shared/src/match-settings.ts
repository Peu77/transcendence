export enum RotationSystem {
  SRS = 'SRS',
}

export enum GarbageCancel {
  FULL = 'full',
  PARTIAL = 'partial',
  NONE = 'none',
}

export enum PieceRandomizer {
  SEVEN_BAG = '7-bag',
}

export type MatchSettings = {
  /**
   * Automatic downward fall speed of pieces.
   * `1` keeps the standard level-based speed curve.
   * Any other positive value is treated as a direct rows-per-second override.
   */
  gravity: number

  /**
   * Time in milliseconds before a piece locks after touching the stack.
   * Resets on movement or rotation, up to lockResetLimit times.
   */
  lockDelayMs: number

  /**
   * Maximum number of lock delay resets allowed per piece.
   * Prevents infinite stalling on the stack.
   */
  lockResetLimit: number

  /**
   * Delay in milliseconds before the next piece spawns
   * after the previous piece locks.
   */
  areMs: number

  /**
   * Pause in milliseconds after clearing lines.
   * Competitive modes typically use 0.
   */
  lineClearDelayMs: number

  /**
   * Rotation system used by the game.
   * Currently only modern SRS is supported.
   */
  rotationSystem: RotationSystem

  /**
   * Enables or disables the hold mechanic entirely.
   */
  hold: boolean

  /**
   * Number of upcoming pieces shown in the preview queue.
   */
  nextCount: number

  /**
   * Piece randomization algorithm.
   * 7-bag ensures fair distribution of tetrominoes.
   */
  bag: PieceRandomizer

  /**
   * Prevents S or Z pieces from appearing as the first piece of the match.
   * Optional fairness rule to avoid early forced misdrops.
   */
  forbidInitialSZ: boolean

  /**
   * Width of the playfield in columns.
   * Standard guideline width is 10.
   */
  width: number

  /**
   * Height of the visible playfield in rows.
   * Standard guideline height is 20.
   */
  height: number

  /**
   * Number of hidden rows above the visible playfield.
   * Used for piece spawn and top-out detection.
   */
  hiddenRows: number

  /**
   * Garbage attack and defense behavior in versus modes.
   */
  garbage: {
    /**
     * Enables or disables garbage entirely.
     * When disabled, the match is purely survival-based.
     */
    enabled: boolean

    /**
     * Time in milliseconds between an attack being sent
     * and the garbage appearing on the opponent's board.
     */
    delayMs: number

    /**
     * Determines how incoming garbage interacts with outgoing attacks.
     * - full: outgoing damage cancels incoming garbage completely
     * - partial: outgoing damage reduces incoming garbage
     * - none: garbage cannot be canceled
     */
    cancel: GarbageCancel

    /**
     * Number of holes per garbage line.
     * Competitive modes typically use 1.
     */
    holeCount: number

    /**
     * Controls how often garbage holes change columns.
     * 0 = perfectly clean, 1 = fully random per line.
     */
    messiness: number
  }

  /**
   * Damage calculation rules for line clears.
   */
  damage: {
    /**
     * Base damage sent for each type of line clear.
     * Values represent lines of garbage.
     */
    table: {
      single: number
      double: number
      triple: number
      tetris: number
      tSpinMiniSingle: number
      tSpinMiniDouble: number
      tSpinSingle: number
      tSpinDouble: number
      tSpinTriple: number
      allClear: number
    }

    /**
     * Garbage bonus added per combo level.
     * Index = combo count. Last value applies for all higher combos.
     * Example: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
     */
    comboTable: number[]

    /**
     * Flat garbage bonus added when a difficult clear (Tetris or T-Spin)
     * follows another difficult clear (Back-to-Back).
     */
    backToBackBonus: number

    /**
     * Maximum lines of garbage that can be sent from a single piece placement.
     */
    garbageCap: number
  }
}
