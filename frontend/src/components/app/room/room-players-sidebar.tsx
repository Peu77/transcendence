import { ProfileImage } from '@/components/app/profileImage.tsx'
import type { RoomPlayersSidebarProps } from './types.ts'

export function RoomPlayersSidebar({
  room,
  currentUserId,
}: RoomPlayersSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card/95 p-5 text-card-foreground shadow-lg backdrop-blur">
      <div className="border-b border-border/70 pb-4">
        <h2 className="mt-2 text-2xl font-bold">
          Players ({room.users.length})
        </h2>
      </div>

      <ul className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {room.users.map((user) => {
          const isHost = user.id === room.hostUserId
          const isMe = user.id === currentUserId

          return (
            <li
              key={user.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3"
            >
              <ProfileImage profilePictureId={user.profilePictureId} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-foreground">
                    {user.username}
                  </span>
                  {isMe && (
                    <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      You
                    </span>
                  )}
                </div>
              </div>

              {isHost && (
                <span className="rounded bg-yellow-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Host
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
