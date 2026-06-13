import { useRealtimeStatus } from '@/realtime/useRealtimeStore'

export function RealtimeStatus() {
  const status = useRealtimeStatus()

  if (status === 'connected') return null

  const label =
    status === 'reconnecting'
      ? 'Reconnecting...'
      : status === 'connecting'
        ? 'Connecting...'
        : 'Disconnected'

  return (
    <div className="bg-destructive text-destructive-foreground text-center text-xs py-1">
      {label}
    </div>
  )
}
