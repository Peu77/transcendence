import type { GameMetrics } from '@transcendence/shared'

/** Per-player outcome of a finished match, fed into the stats aggregator. */
export interface MatchStatInput {
  userId: string
  won: boolean
  lost: boolean
  score: number
  lines: number
  metrics: GameMetrics
  playTimeInSeconds: number
}

/** Normalized, numeric view of a user's aggregated stats. */
export interface UserStatsView {
  userId: string
  matchesPlayed: number
  matchesWon: number
  matchesLost: number
  totalScore: number
  highestScore: number
  totalLinesCleared: number
  totalPiecesPlaced: number
  bestCombo: number
  playTimeInSeconds: number
  metrics: Record<string, number>
  // Derived
  winRate: number
  averageScore: number
}

/** Metric keys from GameMetrics that are summed into the JSONB bag. */
export const SUMMABLE_METRIC_KEYS: (keyof GameMetrics)[] = [
  'singles',
  'doubles',
  'triples',
  'tetrises',
  'holds',
]
