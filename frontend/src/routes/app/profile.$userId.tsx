import { createRoute, useRouter } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { useGetPublicProfile, timeAgo, type PublicProfile } from '@/api/user.ts'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { LevelBar } from '@/components/app/levelBar.tsx'
import { StatCard } from '@/components/app/statCard.tsx'
import { AddFriendButton } from '@/components/app/addFriendButton.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import { Button } from '@/components/ui/button.tsx'
import { ArrowLeftIcon } from 'lucide-react'

function ProfileContent({ profile }: { profile: PublicProfile }) {
  const level = Math.floor(profile.totalLines / 10) + 1
  const rank = profile.rank !== null ? `#${profile.rank}` : 'Unranked'
  const points = profile.totalScore !== null ? profile.totalScore.toLocaleString() : '—'

  return (
    <div className="flex flex-col items-center gap-6 pt-8">
      <div className="w-32 h-32 rounded-full overflow-hidden">
        <ProfileImage profilePictureId={profile.profilePictureId} />
      </div>
      <h2 className="text-4xl font-bold">{profile.username}</h2>

      <div className="flex gap-6">
        <StatCard value={rank} label="Rank" />
        <StatCard value={points} label="Points" />
        <StatCard value={`${level}`} label="Level" />
      </div>

      <div className="w-full max-w-sm">
        <LevelBar totalLines={profile.totalLines} />
      </div>

      <span className="text-sm text-muted-foreground">
        Joined {timeAgo(new Date(profile.createdAt))}
      </span>
    </div>
  )
}

function ProfilePage() {
  const { userId } = ProfilePageRoute.useParams()
  const { data: profile, isLoading } = useGetPublicProfile(userId, true)
  const router = useRouter()

  return (
    <div className="container mx-auto p-6 flex flex-col h-full max-w-4xl">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.history.back()}>
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>

      {isLoading || !profile ? (
        <div className="flex items-center justify-center flex-1">
          <Spinner className="size-8" />
        </div>
      ) : (
        <>
          <ProfileContent profile={profile} />
          <div className="flex justify-center mt-6">
            <AddFriendButton userId={userId} />
          </div>
        </>
      )}
    </div>
  )
}

export const ProfilePageRoute = createRoute({
  getParentRoute: () => AppRoute,
  path: '/profile/$userId',
  component: ProfilePage,
})
