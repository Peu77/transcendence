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
import { SharedPointsPie } from '@/components/app/sharedPointsPie.tsx'
import { WinRatePie } from '@/components/app/winRatePie.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import { Button } from '@/components/ui/button.tsx'
import { CrownIcon, Gamepad2Icon } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { sendMatchInvite, useGetFriends } from '@/api/friends.ts'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { userStore } from '@/store/userStore.ts'
import { setFriendsOverlayIsOpen } from '@/store/friendsOverlayStore.tsx'

const ProfileContent = ({ profile }: { profile: PublicProfile }) => {
  const level = Math.floor(profile.totalLines / 10) + 1
  const rank = profile.rank !== null ? `#${profile.rank}` : 'Unranked'
  const points =
    profile.totalScore !== null ? profile.totalScore.toLocaleString() : '—'

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <ProfileImage profilePictureId={profile.profilePictureId} />
        <h2 className="text-2xl font-bold">{profile.username}</h2>
        {profile.rank === 1 && <CrownIcon className="size-5 text-yellow-500" />}
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
        <div className="flex gap-8 items-start justify-center">
          <FriendshipRing sharedMatchCount={profile.sharedMatchCount} />
          <SharedPointsPie
            sharedPoints={profile.sharedPoints}
            totalPoints={profile.requesterTotalPoints}
          />
          <WinRatePie
            wins={profile.winsAgainstThem}
            total={profile.sharedMatchCount}
          />
        </div>
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
  const currentUserId = useStore(userStore, (user) => user?.id)
  const friendsQuery = useGetFriends()
  const navigate = useNavigate()
  const isFriend = friendsQuery.data?.some((friend) => friend.id === userId)
  const inviteMutation = useMutation({
    mutationFn: () => sendMatchInvite(userId),
    onSuccess: async (message) => {
      if (!message.roomId) return
      onOpenChange(false)
      setFriendsOverlayIsOpen(false)
      await navigate({
        to: '/app/room/$roomId',
        params: { roomId: message.roomId },
      })
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? 'Failed to send match invite',
      )
    },
  })

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
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <AddFriendButton
                userId={userId}
                blockedByThem={profile.blockedByThem}
                iBlockedThem={profile.iBlockedThem}
              />
              {currentUserId !== userId && isFriend && (
                <Button
                  type="button"
                  onClick={() => inviteMutation.mutate()}
                  disabled={inviteMutation.isPending}
                >
                  <Gamepad2Icon data-icon="inline-start" />
                  {inviteMutation.isPending
                    ? 'Sending invite...'
                    : 'Invite to match'}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
