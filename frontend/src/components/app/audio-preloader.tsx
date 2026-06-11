import { type ReactNode, useEffect, useState } from 'react'
import { Spinner } from '@/components/ui/spinner.tsx'

const ALL_SOUNDS = [
  '/sounds/achievement_unlock.mp3',
  '/sounds/button_click.mp3',
  '/sounds/error.mp3',
  '/sounds/friend_request.mp3',
  '/sounds/game-effects/block_placed.mp3',
  '/sounds/game-effects/cancel_game.mp3',
  '/sounds/game-music/song1.mp3',
  '/sounds/game-music/song2.mp3',
  '/sounds/game-music/song3.mp3',
  '/sounds/game-music/song4.mp3',
  '/sounds/game-music/song5.mp3',
  '/sounds/game-music/song6.mp3',
  '/sounds/game_start.mp3',
  '/sounds/loose.mp3',
  '/sounds/menu_hover.mp3',
  '/sounds/message_receive.mp3',
  '/sounds/message_send.mp3',
  '/sounds/win.mp3',
]

function preloadAudio(src: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.preload = 'auto'
    audio.addEventListener('canplaythrough', () => resolve(), { once: true })
    audio.addEventListener('error', () => resolve(), { once: true })
    audio.src = src
  })
}

export function AudioPreloader({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [loaded, setLoaded] = useState(0)

  useEffect(() => {
    let cancelled = false
    let count = 0

    Promise.all(
      ALL_SOUNDS.map((src) =>
        preloadAudio(src).then(() => {
          if (cancelled) return
          count++
          setLoaded(count)
        }),
      ),
    ).then(() => {
      if (!cancelled) setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
        <Spinner className="size-10" />
        <p className="text-sm text-muted-foreground">
          Loading audio... {loaded}/{ALL_SOUNDS.length}
        </p>
      </div>
    )
  }

  return <>{children}</>
}
