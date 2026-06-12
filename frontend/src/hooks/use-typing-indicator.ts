import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveEvent } from '@/realtime/hooks.ts'
import { useLiveSocket } from '@/realtime/useRealtimeStore.ts'

const THROTTLE_MS = 2000
const EXPIRY_MS = 3000

export function useDmTypingIndicator(friendUserId: string) {
  const socket = useLiveSocket()
  const [isTyping, setIsTyping] = useState(false)
  const lastEmitRef = useRef(0)
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useLiveEvent(
    'dm.typing',
    useCallback(
      (event: { userId: string }) => {
        if (event.userId !== friendUserId) return
        setIsTyping(true)

        if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
        expiryTimerRef.current = setTimeout(() => {
          setIsTyping(false)
        }, EXPIRY_MS)
      },
      [friendUserId],
    ),
  )

  useEffect(() => {
    return () => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
    }
  }, [])

  useEffect(() => {
    setIsTyping(false)
    lastEmitRef.current = 0
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
  }, [friendUserId])

  const emitTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastEmitRef.current < THROTTLE_MS) return
    lastEmitRef.current = now
    ;(socket as any).emit('dm.typing', { withUserId: friendUserId })
  }, [socket, friendUserId])

  return { isTyping, emitTyping }
}

export function useRoomTypingIndicator(
  roomId: string,
  currentUserId: string | undefined,
) {
  const socket = useLiveSocket()
  const [typingUsers, setTypingUsers] = useState<
    Map<string, { username: string; expiresAt: number }>
  >(new Map())
  const lastEmitRef = useRef(0)
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useLiveEvent(
    'room.chat.typing',
    useCallback(
      (event: { roomId: string; userId: string; username: string }) => {
        if (event.roomId !== roomId) return
        if (event.userId === currentUserId) return

        setTypingUsers((prev) => {
          const next = new Map(prev)
          next.set(event.userId, {
            username: event.username,
            expiresAt: Date.now() + EXPIRY_MS,
          })
          return next
        })
      },
      [roomId, currentUserId],
    ),
  )

  useEffect(() => {
    cleanupTimerRef.current = setInterval(() => {
      const now = Date.now()
      setTypingUsers((prev) => {
        let changed = false
        const next = new Map(prev)
        for (const [id, entry] of next) {
          if (entry.expiresAt <= now) {
            next.delete(id)
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 1000)

    return () => {
      if (cleanupTimerRef.current) clearInterval(cleanupTimerRef.current)
    }
  }, [])

  useEffect(() => {
    setTypingUsers(new Map())
    lastEmitRef.current = 0
  }, [roomId])

  const emitTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastEmitRef.current < THROTTLE_MS) return
    lastEmitRef.current = now
    ;(socket as any).emit('room.chat.typing', { roomId })
  }, [socket, roomId])

  const typingUsersList = Array.from(typingUsers.values()).map(
    (entry) => entry.username,
  )

  return { typingUsers: typingUsersList, emitTyping }
}
