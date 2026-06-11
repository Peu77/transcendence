import { useState } from 'react'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { Button } from '@/components/ui/button.tsx'
import type { RoomPlayersSidebarProps } from './types.ts'
import { ProfileDialog } from '@/components/app/profileDialog.tsx'
import { useGetFriends } from '@/api/friends.ts'
import { HeartIcon } from 'lucide-react'

export function RoomPlayersSidebar({
  room,
  currentUserId,
  onLeaveRoom,
}: RoomPlayersSidebarProps) {
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const { data: friends } = useGetFriends()
  const friendIds = new Set(friends?.map((f) => f.id) ?? [])

  return (
    <aside className="flex h-full min-h-0 flex-col bg-background/80 px-7 pt-4 text-card-foreground">
      <ProfileDialog
        userId={profileUserId ?? ''}
        open={profileUserId !== null}
        onOpenChange={(open) => {
          if (!open) setProfileUserId(null)
        }}
      />
      <div className="border-b border-border/70 pb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wide">
          Players ({room.users.length})
        </h2>
      </div>

      <ul className="mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {room.users.map((user) => {
          const isHost = user.id === room.hostUserId
          const isMe = user.id === currentUserId

          return (
            <li
              key={user.id}
              onClick={() => setProfileUserId(user.id)}
              className="flex items-center gap-3 rounded-md border border-border/60 bg-card/60 p-3 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="relative shrink-0">
                <ProfileImage profilePictureId={user.profilePictureId} />
                {friendIds.has(user.id) && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background">
                    <HeartIcon className="h-3 w-3 fill-pink-500 text-pink-500" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-foreground">
                    {user.username}
                  </span>
                  {isMe && (
                    <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
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

      {onLeaveRoom && (
        <div className="border-t border-border/70 py-5">
          <Button
            type="button"
            variant="destructive"
            className="w-full font-bold uppercase tracking-wide"
            onClick={onLeaveRoom}
          >
            Leave Room
          </Button>
        </div>
      )}
    </aside>
  )
}
