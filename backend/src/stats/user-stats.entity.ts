import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../users/user.entity'

/**
 * Aggregated, per-user lifetime gameplay statistics.
 *
 * This is a derived cache: the source of truth remains `MatchResult` (one row
 * per player per match, including the full final game state). This table is
 * updated incrementally as matches finish so reads (profile, leaderboard,
 * achievements) stay cheap.
 *
 * Columns are split into two groups:
 *  - First-class columns for values we sort/leaderboard/query on.
 *  - A free-form JSONB `metrics` bag for open-ended counters that can grow
 *    over time (e.g. t-spins) without a schema migration.
 */
@Entity({ name: 'user_stats' })
export class UserStats {
  @PrimaryColumn('uuid')
  userId!: string

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User

  @Column({ type: 'int', default: 0 })
  matchesPlayed!: number

  @Column({ type: 'int', default: 0 })
  matchesWon!: number

  @Column({ type: 'int', default: 0 })
  matchesLost!: number

  // bigint is returned as a string by the pg driver; treat as numeric.
  @Column({ type: 'bigint', default: 0 })
  totalScore!: string

  @Column({ type: 'int', default: 0 })
  highestScore!: number

  @Column({ type: 'int', default: 0 })
  totalLinesCleared!: number

  @Column({ type: 'int', default: 0 })
  totalPiecesPlaced!: number

  @Column({ type: 'int', default: 0 })
  bestCombo!: number

  @Column({ type: 'int', default: 0 })
  playTimeInSeconds!: number

  /**
   * Open-ended summable counters keyed by name (e.g. singles, doubles,
   * triples, tetrises, holds, and future ones like tSpins). Extend by writing
   * a new key here from the engine metrics — no migration required.
   */
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metrics!: Record<string, number>

  @UpdateDateColumn()
  updatedAt!: Date
}
