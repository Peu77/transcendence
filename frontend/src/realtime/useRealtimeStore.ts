import { useStore } from '@tanstack/react-store'
import { realtimeStore, type RealtimeState } from './store'

export function useLiveSocket() {
  return useStore(realtimeStore, (s: RealtimeState) => s.socket)
}
