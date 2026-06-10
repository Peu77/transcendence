import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog.tsx'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { LevelBar } from '@/components/app/levelBar.tsx'
import { StatCard } from '@/components/app/statCard.tsx'
import { useGetPublicProfile, timeAgo, type PublicProfile } from '@/api/user.ts'
import { AddFriendButton } from '@/components/app/addFriendButton.tsx'
import { FriendshipRing } from '@/components/app/friendshipRing.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'

const ProfileContent = ({ profile }: { profile: PublicProfile }) => {
  const level = Math.floor(profile.totalLines / 10) + 1
  const rank = profile.rank !== null ? `#${profile.rank}` : 'Unranked'
  const points = profile.totalScore !== null ? profile.totalScore.toLocaleString() : '—'

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <ProfileImage profilePictureId={profile.profilePictureId} />
        <h2 className="text-2xl font-bold">{profile.username}</h2>
      </div>
      <div className="flex gap-4">
        <StatCard value={rank} label="Rank" size="sm" />
        <StatCard value={points} label="Points" size="sm" />
        <StatCard value={`${level}`} label="Level" size="sm" />
      </div>
      <div className="w-full">
        <LevelBar totalLines={profile.totalLines} />
      </div>
      {profile.sharedMatchCount > 0 && (
        <FriendshipRing sharedMatchCount={profile.sharedMatchCount} />
      )}
      <span className="text-sm text-muted-foreground">
        Joined {timeAgo(new Date(profile.createdAt))}
      </span>
    </div>
  )
}

export const ProfileDialog = ({
  userId,
  open,
  onOpenChange,
}: {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const { data: profile, isLoading } = useGetPublicProfile(userId, open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">Profile</DialogTitle>
          <DialogDescription className="sr-only">
            User profile information
          </DialogDescription>
        </DialogHeader>
        {isLoading || !profile ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-8" />
          </div>
        ) : (
          <>
            <ProfileContent profile={profile} />
            <div className="flex justify-center mt-2">
              <AddFriendButton userId={userId} blockedByThem={profile.blockedByThem} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
