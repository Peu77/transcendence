import { useEffect } from 'react'
import { connectRealtime, disconnectRealtime } from './store'
import { useGlobalListeners } from '@/realtime/globalListeners.ts'

/**
 * Mount this once in the authenticated area to connect the websocket.
 */
export function RealtimeMount() {
  useGlobalListeners()
  useEffect(() => {
    connectRealtime()
    return () => disconnectRealtime()
  }, [])

  return null
}
