import { createRoute, useRouter } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { useGetPublicProfile, timeAgo } from '@/api/user.ts'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import { Button } from '@/components/ui/button.tsx'
import { ArrowLeftIcon } from 'lucide-react'

const LINES_PER_LEVEL = 10

const ProfilePage = () => {
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
      ) : (() => {
        const level = Math.floor(profile.totalLines / LINES_PER_LEVEL) + 1
        const linesIntoLevel = profile.totalLines % LINES_PER_LEVEL
        const progress = linesIntoLevel / LINES_PER_LEVEL

        return (
          <div className="flex flex-col items-center gap-6 pt-8">
            <div className="w-32 h-32 rounded-full overflow-hidden">
              <ProfileImage profilePictureId={profile.profilePictureId} />
            </div>
            <h2 className="text-4xl font-bold">{profile.username}</h2>

            <div className="flex gap-6">
              <div className="flex flex-col items-center gap-1 rounded-md bg-muted px-6 py-3">
                <span className="text-2xl font-bold">
                  {profile.rank !== null ? `#${profile.rank}` : 'Unranked'}
                </span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Rank</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-md bg-muted px-6 py-3">
                <span className="text-2xl font-bold">
                  {profile.totalScore !== null ? profile.totalScore.toLocaleString() : '—'}
                </span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Points</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-md bg-muted px-6 py-3">
                <span className="text-2xl font-bold">{level}</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Level</span>
              </div>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Level {level}</span>
                <span>{linesIntoLevel} / {LINES_PER_LEVEL} lines</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="text-right text-xs text-muted-foreground">
                Level {level + 1}
              </div>
            </div>

            <span className="text-sm text-muted-foreground">Joined {timeAgo(new Date(profile.createdAt))}</span>
          </div>
        )
      })()}
    </div>
  )
}

export const ProfilePageRoute = createRoute({
  getParentRoute: () => AppRoute,
  path: '/profile/$userId',
  component: ProfilePage,
})
