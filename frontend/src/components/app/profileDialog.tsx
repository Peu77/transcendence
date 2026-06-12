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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { CrownIcon, Gamepad2Icon } from 'lucide-react'
import { useGetFriends } from '@/api/friends.ts'
import { useStore } from '@tanstack/react-store'
import { userStore } from '@/store/userStore.ts'
import { useMatchInvite } from '@/hooks/use-match-invite.ts'

const ProfileContent = ({ profile }: { profile: PublicProfile }) => {
  const level = Math.floor(profile.totalLines / 10) + 1
  const rank = profile.rank !== null ? `#${profile.rank}` : 'Unranked'
  const points =
    profile.totalScore !== null ? profile.totalScore.toLocaleString() : '—'

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <ProfileImage profilePictureId={profile.profilePictureId} />
        <h2 className="truncate text-xl font-bold">{profile.username}</h2>
        {profile.rank === 1 && (
          <CrownIcon className="size-5 shrink-0 text-yellow-500" />
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <StatCard value={rank} label="Rank" size="sm" />
        <StatCard value={points} label="Points" size="sm" />
        <StatCard value={`${level}`} label="Level" size="sm" />
      </div>
      <div className="w-full">
        <LevelBar totalLines={profile.totalLines} />
      </div>
      {profile.sharedMatchCount > 0 && (
        <div className="flex flex-wrap items-start justify-center gap-4">
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
  const isFriend = friendsQuery.data?.some((friend) => friend.id === userId)
  const inviteMutation = useMatchInvite(userId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
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
            {currentUserId !== userId && (
              <TooltipProvider>
                <div className="mt-2 flex justify-center gap-2.5 border-t border-border/60 pt-4">
                  {isFriend && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Button
                            type="button"
                            size="icon-lg"
                            aria-label="Invite to match"
                            onClick={() => inviteMutation.mutate()}
                            disabled={inviteMutation.isPending}
                            className="size-11 border border-primary/40 shadow-[0_6px_18px_-8px_var(--primary)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
                          >
                            <Gamepad2Icon
                              className={`size-5 ${
                                inviteMutation.isPending ? 'animate-pulse' : ''
                              }`}
                            />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {inviteMutation.isPending
                          ? 'Sending invite…'
                          : 'Invite to match'}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <AddFriendButton
                    userId={userId}
                    blockedByThem={profile.blockedByThem}
                    iBlockedThem={profile.iBlockedThem}
                    compact
                  />
                </div>
              </TooltipProvider>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
