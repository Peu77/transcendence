import { useState } from 'react'
import type { Friend } from '@/api/friends.ts'
import { Button } from '@/components/ui/button.tsx'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { PresencePill } from '@/components/app/friends/presencePill.tsx'
import { ProfileDialog } from '@/components/app/profileDialog.tsx'

export const FriendRow = (props: {
  friend: Friend
  onOpenDM: () => void
  onDelete: () => void
  onBlock: () => void
}) => {
  const { friend } = props
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-sidebar-border/60">
      <button
        onClick={() => setProfileOpen(true)}
        className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity cursor-pointer"
      >
        <ProfileImage profilePictureId={friend.profilePictureId} />
        <div className="min-w-0">
          <div className="font-medium truncate">{friend.username}</div>
          <PresencePill friend={friend} />
        </div>
      </button>
      <ProfileDialog
        userId={friend.id}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />

      <div className="flex items-center gap-1">
        <Button size="sm" variant="secondary" onClick={props.onOpenDM}>
          DM
        </Button>
        <Button size="sm" variant="outline" onClick={props.onDelete}>
          Remove
        </Button>
        <Button size="sm" variant="destructive" onClick={props.onBlock}>
          Block
        </Button>
      </div>
    </div>
  )
}
