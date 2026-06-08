import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog.tsx'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { useGetPublicProfile, timeAgo } from '@/api/user.ts'
import { Spinner } from '@/components/ui/spinner.tsx'

const LINES_PER_LEVEL = 10

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
        {isLoading || !profile ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-8" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Profile</DialogTitle>
              <DialogDescription className="sr-only">
                User profile information
              </DialogDescription>
            </DialogHeader>
            {(() => {
              const level = Math.floor(profile.totalLines / LINES_PER_LEVEL) + 1
              const linesIntoLevel = profile.totalLines % LINES_PER_LEVEL
              const progress = linesIntoLevel / LINES_PER_LEVEL

              return (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                    <ProfileImage profilePictureId={profile.profilePictureId} />
                    <h2 className="text-2xl font-bold">{profile.username}</h2>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center rounded-md bg-muted px-4 py-2">
                      <span className="text-lg font-bold">
                        {profile.rank !== null ? `#${profile.rank}` : 'Unranked'}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">Rank</span>
                    </div>
                    <div className="flex flex-col items-center rounded-md bg-muted px-4 py-2">
                      <span className="text-lg font-bold">
                        {profile.totalScore !== null ? profile.totalScore.toLocaleString() : '—'}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">Points</span>
                    </div>
                    <div className="flex flex-col items-center rounded-md bg-muted px-4 py-2">
                      <span className="text-lg font-bold">{level}</span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">Level</span>
                    </div>
                  </div>
                  <div className="w-full flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Level {level}</span>
                      <span>{linesIntoLevel} / {LINES_PER_LEVEL} lines</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-background overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-muted-foreground">Level {level + 1}</div>
                  </div>
                  <span className="text-sm text-muted-foreground">Joined {timeAgo(new Date(profile.createdAt))}</span>
                </div>
              )
            })()}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
