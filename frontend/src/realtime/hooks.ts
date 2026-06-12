import { useEffect, useRef } from 'react'
import type { LiveEventMap } from './events'
import { useLiveSocket } from './useRealtimeStore'

export function useLiveEvent<K extends keyof LiveEventMap>(
  event: K,
  handler: (payload: LiveEventMap[K]) => void,
) {
  const socket = useLiveSocket()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const fn = ((payload: LiveEventMap[K]) => {
      handlerRef.current(payload)
    }) as unknown as (...args: any[]) => void

    (socket as any).on(event as string, fn)
    return () => {
      (socket as any).off(event as string, fn)
    }
  }, [socket, event])
}

export function useDmRoom(friendUserId: string | null) {
  const socket = useLiveSocket()

  useEffect(() => {
    if (!friendUserId) {
      return
    }

    (socket as any).emit('dm.join', { withUserId: friendUserId })
    return () => {
      (socket as any).emit('dm.leave', { withUserId: friendUserId })
    }
  }, [socket, friendUserId])
}
