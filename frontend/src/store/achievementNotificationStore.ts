import { Store } from '@tanstack/store'
import type { QueryClient } from '@tanstack/react-query'
import type { Achievement, AchievementsResponse } from '@/api/achievements.ts'
import { getAchievements } from '@/api/achievements.ts'

export const achievementNotificationStore = new Store<Achievement[]>([])

export function queueAchievementNotifications(achievements: Achievement[]) {
  achievementNotificationStore.setState((prev) => [...prev, ...achievements])
}

export function dismissFirstAchievementNotification() {
  achievementNotificationStore.setState((prev) => prev.slice(1))
}

// Tracks whether a multiplayer game is currently in progress.
// Achievement popups are suppressed while this is true.
let _gameActive = false
export const gameActiveState = {
  set: (v: boolean) => { _gameActive = v },
  get: () => _gameActive,
}

export async function checkAndQueueNewAchievements(qc: QueryClient) {
  if (_gameActive) return
  const prev = qc.getQueryData<AchievementsResponse>(['achievements'])
  const prevUnlocked = new Set(
    prev?.achievements.filter((a) => a.unlocked).map((a) => a.id) ?? [],
  )
  const next = await qc.fetchQuery({
    queryKey: ['achievements'],
    queryFn: getAchievements,
    staleTime: 0,
  })
  const newly = next.achievements.filter(
    (a) => a.unlocked && !prevUnlocked.has(a.id),
  )
  if (newly.length > 0) queueAchievementNotifications(newly)
}
