import { Store } from '@tanstack/store'
import type { QueryClient } from '@tanstack/react-query'
import type { Achievement } from '@/api/achievements.ts'
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

// --- Persistent "already notified" tracking via localStorage ---
// This prevents re-showing achievements across page reloads or
// whenever the query cache is empty (e.g. first load after a cold start).

const NOTIFIED_KEY = 'achievement_notified_ids'
const INITIALIZED_KEY = 'achievement_baseline_set'

function loadNotified(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveNotified(ids: string[]): void {
  try {
    const current = loadNotified()
    ids.forEach((id) => current.add(id))
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...current]))
  } catch {}
}

function isBaselineSet(): boolean {
  return localStorage.getItem(INITIALIZED_KEY) === 'true'
}

function markBaselineSet(): void {
  try {
    localStorage.setItem(INITIALIZED_KEY, 'true')
  } catch {}
}

// Call once on app startup. Marks all currently-unlocked achievements as
// already seen so they never pop up as "new" on first load.
export async function initAchievementBaseline(qc: QueryClient): Promise<void> {
  if (isBaselineSet()) return
  try {
    const data = await qc.fetchQuery({
      queryKey: ['achievements'],
      queryFn: getAchievements,
      staleTime: 60_000,
    })
    saveNotified(data.achievements.filter((a) => a.unlocked).map((a) => a.id))
    markBaselineSet()
  } catch {}
}

export async function checkAndQueueNewAchievements(qc: QueryClient): Promise<void> {
  if (_gameActive) return
  // If the baseline hasn't been seeded yet, do nothing — initAchievementBaseline
  // will handle it; we don't want to fire notifications before it's run.
  if (!isBaselineSet()) return

  const notified = loadNotified()
  const next = await qc.fetchQuery({
    queryKey: ['achievements'],
    queryFn: getAchievements,
    staleTime: 0,
  })
  const newly = next.achievements.filter((a) => a.unlocked && !notified.has(a.id))
  if (newly.length > 0) {
    saveNotified(newly.map((a) => a.id))
    queueAchievementNotifications(newly)
  }
}
