import type { Friend } from '@/api/friends.ts'

export const PresencePill = ({ friend }: { friend: Friend }) => {
  const status = friend.presence?.status ?? 'offline'

  const dotClass: Record<string, string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    'in-room': 'bg-blue-500',
    'in-game': 'bg-purple-500',
    offline: 'bg-muted-foreground',
  }
  const cls = dotClass[status] ?? 'bg-muted-foreground'

  const label =
    status === 'in-room' ? 'in room'
    : status === 'in-game' ? 'in game'
    : status

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`inline-block size-2 rounded-full ${cls}`} />
      <span className="capitalize text-muted-foreground">{label}</span>
    </div>
  )
}
