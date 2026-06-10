import { Store } from '@tanstack/store'
import type { Achievement } from '@/api/achievements.ts'

export const achievementNotificationStore = new Store<Achievement[]>([])

export function queueAchievementNotifications(achievements: Achievement[]) {
  achievementNotificationStore.setState((prev) => [...prev, ...achievements])
}

export function dismissFirstAchievementNotification() {
  achievementNotificationStore.setState((prev) => prev.slice(1))
}
