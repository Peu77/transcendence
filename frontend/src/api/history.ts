import { axios } from '@/lib/client.ts'
import { useQuery } from '@tanstack/react-query'

export interface MatchHistoryPlayer {
  userId: string
  username: string
  profilePictureId: string | null
  score: number
  lines: number
  level: number
  placement: number
}

export interface MatchHistoryItem {
  matchId: string
  roomId: string
  playedAt: string
  placement: number
  playerCount: number
  score: number
  lines: number
  level: number
  players: MatchHistoryPlayer[]
}

export const HISTORY_QUERY_KEYS = {
  all: ['match-history'] as const,
}

export async function getMatchHistory(): Promise<MatchHistoryItem[]> {
  const response = await axios.get<MatchHistoryItem[]>('/users/me/history')
  return response.data
}

export function useMatchHistory() {
  return useQuery({
    queryKey: HISTORY_QUERY_KEYS.all,
    queryFn: getMatchHistory,
  })
}
