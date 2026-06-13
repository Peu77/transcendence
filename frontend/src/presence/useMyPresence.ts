import { useEffect, useRef } from 'react'
import { updateMyPresence, type PresenceStatus } from '@/api/friends'
import { realtimeStore } from '@/realtime/store'

// When frozen, the layout presence hook skips online/away updates so that
// in-room/in-game status set by game routes is not overwritten.
let _frozen = false
export const freezePresence = () => { _frozen = true }
export const unfreezePresence = () => { _frozen = false }

export type UseMyPresenceOptions = {
  /**
   * Enables/disables presence management. Call the hook unconditionally and
   * toggle behavior via this flag to avoid violating the Rules of Hooks.
   */
  enabled?: boolean
  /**
   * If true, will call PATCH /presence with {status:"online"} on mount.
   * Defaults to true.
   */
  setOnlineOnMount?: boolean
  /**
   * If true, tries to set {status:"offline"} on unmount (best-effort).
   * Defaults to true.
   */
  setOfflineOnUnmount?: boolean
  /**
   * If provided, will set {status:"away"} after this many ms of inactivity.
   * Defaults to 60s.
   */
  idleMs?: number
}

function useStablePresenceUpdater() {
  const lastSentRef = useRef<PresenceStatus | null>(null)
  return async (status: PresenceStatus) => {
    if (lastSentRef.current === status) return
    lastSentRef.current = status
    try {
      await updateMyPresence({ status })
    } catch {
      // Presence is best-effort; ignore errors (e.g., race with logout).
    }
  }
}

/**
 * Keeps the authenticated user's presence up-to-date.
 *
 * Contract:
 * - On mount -> online (default)
 * - After idle -> away
 * - On activity while away -> online
 * - On unmount -> offline (best-effort)
 */
export function useMyPresence(options: UseMyPresenceOptions = {}) {
  const {
    enabled = true,
    setOnlineOnMount = true,
    setOfflineOnUnmount = true,
    idleMs = 60_000,
  } = options

  const setPresence = useStablePresenceUpdater()

  const idleTimerRef = useRef<number | null>(null)
  const isAwayRef = useRef(false)

  useEffect(() => {
    if (!enabled) return

    let mounted = true

    const clearIdleTimer = () => {
      if (idleTimerRef.current) globalThis.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }

    const scheduleIdle = () => {
      clearIdleTimer()
      idleTimerRef.current = globalThis.setTimeout(async () => {
        if (!mounted || _frozen) return
        isAwayRef.current = true
        await setPresence('away')
      }, idleMs) as unknown as number
    }

    const onActivity = async () => {
      if (_frozen) return
      scheduleIdle()
      if (!isAwayRef.current) return
      isAwayRef.current = false
      await setPresence('online')
    }

    // Initial mount
    ;(async () => {
      if (setOnlineOnMount && !_frozen) {
        isAwayRef.current = false
        await setPresence('online')
      }
      scheduleIdle()
    })()

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'focus',
    ]
    for (const evt of events)
      globalThis.addEventListener(evt, onActivity, { passive: true } as any)

    const onBeforeUnload = () => {
      if (!setOfflineOnUnmount) return
      void setPresence('offline')
    }
    globalThis.addEventListener('beforeunload', onBeforeUnload as any)

    let firstConnect = true
    const onSocketConnect = () => {
      if (firstConnect) { firstConnect = false; return }
      if (!mounted || _frozen) return
      void updateMyPresence({ status: isAwayRef.current ? 'away' : 'online' })
    }
    const socket = realtimeStore.state.socket
    socket.on('connect', onSocketConnect)

    return () => {
      mounted = false
      clearIdleTimer()
      for (const evt of events)
        globalThis.removeEventListener(evt, onActivity as any)
      globalThis.removeEventListener('beforeunload', onBeforeUnload as any)
      socket.off('connect', onSocketConnect)
      if (setOfflineOnUnmount) void setPresence('offline')
    }
  }, [enabled, idleMs, setOfflineOnUnmount, setOnlineOnMount, setPresence])
}
