import { createRoute, useRouter } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { useGetPublicProfile, timeAgo } from '@/api/user.ts'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import { Button } from '@/components/ui/button.tsx'
import { ArrowLeftIcon } from 'lucide-react'

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
      ) : (
        <div className="flex flex-col items-center gap-6 pt-8">
          <div className="w-32 h-32 rounded-full overflow-hidden">
            <ProfileImage profilePictureId={profile.profilePictureId} />
          </div>
          <h2 className="text-4xl font-bold">{profile.username}</h2>
          <div className="flex flex-col items-center gap-1 text-muted-foreground text-sm">
            <span>Level {profile.level}</span>
            <span>Joined {timeAgo(new Date(profile.createdAt))}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export const ProfilePageRoute = createRoute({
  getParentRoute: () => AppRoute,
  path: '/profile/$userId',
  component: ProfilePage,
})
