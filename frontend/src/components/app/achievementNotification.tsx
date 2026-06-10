import { useEffect, useRef } from 'react'
import { useStore } from '@tanstack/react-store'
import { TrophyIcon } from 'lucide-react'
import type { Achievement } from '@/api/achievements.ts'
import {
  achievementNotificationStore,
  dismissFirstAchievementNotification,
} from '@/store/achievementNotificationStore.ts'

const DISMISS_MS = 4000

function NotificationCard({
  achievement,
  remaining,
}: {
  achievement: Achievement
  remaining: number
}) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    el.style.width = '100%'
    el.style.transition = 'none'
    void el.offsetWidth
    el.style.transition = `width ${DISMISS_MS}ms linear`
    el.style.width = '0%'
  }, [])

  return (
    <div
      className="animate-in slide-in-from-bottom-4 duration-300 relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-xl border border-violet-500/40 bg-background/95 px-6 py-4 shadow-2xl backdrop-blur-sm"
      style={{ minWidth: '20rem', maxWidth: '24rem' }}
      onClick={dismissFirstAchievementNotification}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
        <TrophyIcon className="h-6 w-6 text-violet-400" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-violet-400">
          Achievement Unlocked
        </div>
        <div className="font-semibold">{achievement.label}</div>
        <div className="text-sm text-muted-foreground">{achievement.description}</div>
      </div>

      {remaining > 0 && (
        <div className="shrink-0 rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-400">
          +{remaining}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted">
        <div ref={barRef} className="h-full rounded-full bg-violet-500" style={{ width: '100%' }} />
      </div>
    </div>
  )
}

export function AchievementNotificationOverlay() {
  const queue = useStore(achievementNotificationStore)
  const current = queue[0]
  const currentId = current?.id

  useEffect(() => {
    if (!currentId) return
    const timer = setTimeout(dismissFirstAchievementNotification, DISMISS_MS)
    return () => clearTimeout(timer)
  }, [currentId])

  if (!current) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center">
      <div className="pointer-events-auto">
        <NotificationCard
          key={current.id}
          achievement={current}
          remaining={queue.length - 1}
        />
      </div>
    </div>
  )
}
