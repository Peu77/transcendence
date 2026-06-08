import { axios } from '@/lib/client.ts'
import { useQuery } from '@tanstack/react-query'

export interface UserStats {
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
  winRate: number
  averageScore: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  category: string
  icon: string
  goal: number
  progress: number
  unlocked: boolean
  unlockedAt: string | null
}

export const STATS_QUERY_KEYS = {
  me: ['stats', 'me'] as const,
  achievements: ['achievements', 'me'] as const,
}

export async function getMyStats(): Promise<UserStats> {
  const response = await axios.get<UserStats>('/stats/me')
  return response.data
}

export async function getMyAchievements(): Promise<Achievement[]> {
  const response = await axios.get<Achievement[]>('/achievements/me')
  return response.data
}

export function useMyStats() {
  return useQuery({
    queryKey: STATS_QUERY_KEYS.me,
    queryFn: getMyStats,
  })
}

export function useMyAchievements() {
  return useQuery({
    queryKey: STATS_QUERY_KEYS.achievements,
    queryFn: getMyAchievements,
  })
}
