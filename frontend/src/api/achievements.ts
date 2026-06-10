import { useQuery } from '@tanstack/react-query'
import { axios } from '@/lib/client.ts'

export type Achievement = {
  id: string
  label: string
  description: string
  unlocked: boolean
}

export type AchievementsResponse = {
  stats: {
    matches: number
    score: number
    lines: number
    wins: number
    friends: number
  }
  achievements: Achievement[]
}

export async function getAchievements(): Promise<AchievementsResponse> {
  const res = await axios.get<AchievementsResponse>('/users/achievements')
  return res.data
}

export function useGetAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: getAchievements,
  })
}
