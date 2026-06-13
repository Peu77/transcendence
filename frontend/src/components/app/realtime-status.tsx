import { LoaderCircleIcon, RefreshCwIcon, WifiOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { connectRealtime, useRealtimeStatus } from '@/realtime'

export function RealtimeStatus() {
  const status = useRealtimeStatus()

  if (status === 'connected') return null

  const isConnecting = status === 'connecting' || status === 'reconnecting'

  return (
    <div
      role={status === 'disconnected' ? 'alert' : 'status'}
      aria-live="polite"
      className={
        isConnecting
          ? 'flex min-h-10 items-center justify-center gap-3 border-y border-amber-500/40 bg-amber-500/10 px-4 py-2 text-amber-950 dark:text-amber-100'
          : 'flex min-h-10 items-center justify-center gap-3 border-y border-destructive/40 bg-destructive/10 px-4 py-2 text-destructive'
      }
    >
      {isConnecting ? (
        <LoaderCircleIcon className="size-4 shrink-0 animate-spin" />
      ) : (
        <WifiOffIcon className="size-4 shrink-0" />
      )}

      <p className="text-center text-sm tracking-wide">
        <span className="font-bold">
          {status === 'connecting'
            ? 'Connecting to live server'
            : status === 'reconnecting'
              ? 'Connection lost. Reconnecting'
              : 'Live connection unavailable'}
        </span>
        <span className="hidden text-current/75 sm:inline">
          {isConnecting
            ? ' — realtime features will resume automatically.'
            : ' — chat, presence, and multiplayer are temporarily paused.'}
        </span>
      </p>

      {!isConnecting && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          silent
          onClick={connectRealtime}
          className="h-7 shrink-0 border-destructive/50 bg-background/60 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <RefreshCwIcon className="size-3.5" />
          Retry
        </Button>
      )}
    </div>
  )
}
