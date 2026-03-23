import type { Friend } from '@/api/friends.ts'
import { Button } from '@/components/ui/button.tsx'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { PresencePill } from '@/components/app/friends/presencePill.tsx'

export const FriendRow = (props: {
  friend: Friend
  onOpenDM: () => void
  onDelete: () => void
}) => {
  const { friend } = props

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-sidebar-border/60">
      <div className="flex items-center gap-2 min-w-0">
        <ProfileImage profilePictureId={friend.profilePictureId} />
        <div className="min-w-0">
          <div className="font-medium truncate">{friend.username}</div>
          <PresencePill friend={friend} />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button size="sm" variant="secondary" onClick={props.onOpenDM}>
          DM
        </Button>
        <Button size="sm" variant="destructive" onClick={props.onDelete}>
          Remove
        </Button>
      </div>
    </div>
  )
}
