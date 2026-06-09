import type { UserStatsView } from '../stats/stats.types'

export type AchievementCategory =
  | 'progression'
  | 'skill'
  | 'dedication'
  | 'lines'

/**
 * A single achievement definition.
 *
 * To add a new achievement, append an entry to `ACHIEVEMENTS` below.
 */
export interface AchievementDefinition {
  id: string
  name: string
  description: string
  category: AchievementCategory
  /** Emoji/icon hint for the UI. */
  icon: string
  /** Value of `progress` at which the achievement unlocks. */
  goal: number
  unit?: 'count' | 'minutes'
  /** Current progress toward `goal` for the given user stats. */
  progress: (stats: UserStatsView) => number
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_match',
    name: 'First Steps',
    description: 'Play your first match.',
    category: 'progression',
    icon: '🎮',
    goal: 1,
    progress: (s) => s.matchesPlayed,
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Play 50 matches.',
    category: 'dedication',
    icon: '🏅',
    goal: 50,
    progress: (s) => s.matchesPlayed,
  },
  {
    id: 'first_win',
    name: 'Winner',
    description: 'Win your first match.',
    category: 'progression',
    icon: '🥇',
    goal: 1,
    progress: (s) => s.matchesWon,
  },
  {
    id: 'on_a_roll',
    name: 'On a Roll',
    description: 'Win 10 matches.',
    category: 'skill',
    icon: '🔥',
    goal: 10,
    progress: (s) => s.matchesWon,
  },
  {
    id: 'line_clearer',
    name: 'Line Clearer',
    description: 'Clear 100 lines in total.',
    category: 'lines',
    icon: '🧹',
    goal: 100,
    progress: (s) => s.totalLinesCleared,
  },
  {
    id: 'line_destroyer',
    name: 'Line Destroyer',
    description: 'Clear 1,000 lines in total.',
    category: 'lines',
    icon: '💥',
    goal: 1000,
    progress: (s) => s.totalLinesCleared,
  },
  {
    id: 'tetris_time',
    name: 'Tetris Time',
    description: 'Clear 10 tetrises (4-line clears).',
    category: 'skill',
    icon: '🟦',
    goal: 10,
    progress: (s) => s.metrics.tetrises ?? 0,
  },
  {
    id: 'high_scorer',
    name: 'High Scorer',
    description: 'Reach a score of 10,000 in a single match.',
    category: 'skill',
    icon: '⭐',
    goal: 10000,
    progress: (s) => s.highestScore,
  },
  {
    id: 'score_hunter',
    name: 'Score Hunter',
    description: 'Reach a score of 50,000 in a single match.',
    category: 'skill',
    icon: '🌟',
    goal: 50000,
    progress: (s) => s.highestScore,
  },
  {
    id: 'score_master',
    name: 'Score Master',
    description: 'Reach a score of 100,000 in a single match.',
    category: 'skill',
    icon: '💫',
    goal: 100000,
    progress: (s) => s.highestScore,
  },
  {
    id: 'score_legend',
    name: 'Score Legend',
    description: 'Reach a score of 250,000 in a single match.',
    category: 'skill',
    icon: '🏆',
    goal: 250000,
    progress: (s) => s.highestScore,
  },
  {
    id: 'combo_starter',
    name: 'Combo Starter',
    description: 'Reach a 5-chain combo.',
    category: 'skill',
    icon: '⚡',
    goal: 5,
    progress: (s) => s.bestCombo,
  },
  {
    id: 'marathoner',
    name: 'Marathoner',
    description: 'Spend a total of 1 hour in matches.',
    category: 'dedication',
    icon: '⏱️',
    goal: 3600,
    unit: 'minutes',
    progress: (s) => s.playTimeInSeconds,
  },
]

export const ACHIEVEMENTS_BY_ID = new Map(
  ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]),
)
