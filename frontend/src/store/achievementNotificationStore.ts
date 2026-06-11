import { Store } from '@tanstack/store'
import type { Achievement } from '@/api/achievements.ts'

export const achievementNotificationStore = new Store<Achievement[]>([])

export function queueAchievementNotifications(achievements: Achievement[]) {
  if (achievements.length > 0) {
    new Audio('/sounds/achievement_unlock.mp3').play().catch(() => {})
  }
  achievementNotificationStore.setState((prev) => [...prev, ...achievements])
}

export function dismissFirstAchievementNotification() {
  achievementNotificationStore.setState((prev) => prev.slice(1))
}
