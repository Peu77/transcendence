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
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                  <ProfileImage profilePictureId={profile.profilePictureId} />
                <h2 className="text-2xl font-bold">{profile.username}</h2>
              </div>
              <div className="flex flex-col items-center gap-1 text-muted-foreground text-sm">
                <span>Level {profile.level}</span>
                <span>Joined {timeAgo(new Date(profile.createdAt))}</span>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
