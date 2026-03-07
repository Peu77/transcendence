import { useEffect } from 'react'
import type { LiveEventMap } from './events'
import { useLiveSocket } from './useRealtimeStore'

export function useLiveEvent<K extends keyof LiveEventMap>(
  event: K,
  handler: (payload: LiveEventMap[K]) => void,
  deps: ReadonlyArray<unknown> = [],
) {
  const socket = useLiveSocket()

  useEffect(() => {
    const fn = handler as unknown as (...args: any[]) => void
    ;(socket as any).on(event as string, fn)
    return () => {
      ;(socket as any).off(event as string, fn)
    }
  }, [socket, event, ...deps])
}

export function useDmRoom(friendUserId: string | null) {
  const socket = useLiveSocket()

  useEffect(() => {
    if (!friendUserId) return
    ;(socket as any).emit('dm.join', { withUserId: friendUserId })
    return () => {
      ;(socket as any).emit('dm.leave', { withUserId: friendUserId })
    }
  }, [socket, friendUserId])
}
