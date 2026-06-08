import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog.tsx'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { LevelBar } from '@/components/app/levelBar.tsx'
import { useGetPublicProfile, timeAgo, type PublicProfile } from '@/api/user.ts'
import { Spinner } from '@/components/ui/spinner.tsx'

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center rounded-md bg-muted px-4 py-2">
    <span className="text-lg font-bold">{value}</span>
    <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
  </div>
)

const ProfileContent = ({ profile }: { profile: PublicProfile }) => (
  <div className="flex flex-col items-center gap-4">
    <div className="flex items-center gap-3">
      <ProfileImage profilePictureId={profile.profilePictureId} />
      <h2 className="text-2xl font-bold">{profile.username}</h2>
    </div>
    <div className="flex gap-4">
      <StatCard
        value={profile.rank !== null ? `#${profile.rank}` : 'Unranked'}
        label="Rank"
      />
      <StatCard
        value={profile.totalScore !== null ? profile.totalScore.toLocaleString() : '—'}
        label="Points"
      />
      <StatCard
        value={String(Math.floor(profile.totalLines / 10) + 1)}
        label="Level"
      />
    </div>
    <div className="w-full">
      <LevelBar totalLines={profile.totalLines} />
    </div>
    <span className="text-sm text-muted-foreground">
      Joined {timeAgo(new Date(profile.createdAt))}
    </span>
  </div>
)

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
          <ProfileContent profile={profile} />
        )}
      </DialogContent>
    </Dialog>
  )
}
