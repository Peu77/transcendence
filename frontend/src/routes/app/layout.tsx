import { Spinner } from '@/components/ui/spinner.tsx'
import { useGetUser } from '@/api/user.ts'
import {
  createRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { rootRoute } from '@/router/root-route.tsx'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Navbar } from '@/components/app/navbar.tsx'
import { userStore } from '@/store/userStore.ts'
import { FriendsOverlay } from '@/components/app/friends/friendsOverlay.tsx'
import { AchievementNotificationOverlay } from '@/components/app/achievementNotification.tsx'
import { RealtimeMount } from '@/realtime'
import { useMyPresence } from '@/presence/useMyPresence'
import { RealtimeStatus } from '@/components/app/realtime-status.tsx'

const AppLayout = () => {
  const userQuery = useGetUser()

  useEffect(() => {
    if (userQuery.data) {
      userStore.setState(() => userQuery.data)
      document.documentElement.classList.toggle(
        'dark',
        userQuery.data.theme === 'dark',
      )
    }
  }, [userQuery.data])

  useMyPresence({ enabled: !!userQuery.data, idleMs: 60_000 })

  const navigate = useNavigate()
  const location = useLocation()
  const isGameRoute =
    location.pathname.includes('/room/') || location.pathname.includes('/solo')

  useEffect(() => {
    if (userQuery.isError) {
      toast.error('You must be logged in to access this page.')
      navigate({ to: '/login' }).catch(console.error)
    }
  }, [navigate, userQuery.isError])

  if (userQuery.isLoading || !userQuery.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-14" />
      </div>
    )
  }

  return (
    <div className="h-screen min-h-0 flex flex-col overflow-hidden bg-background">
      <RealtimeMount />
      <FriendsOverlay />
      <AchievementNotificationOverlay />
      <Navbar />
      <RealtimeStatus />
      <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
        {!isGameRoute && (
          <footer className="p-2 border-t bg-card/50 text-center text-xs text-muted-foreground flex justify-center gap-4">
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <span>&copy; {new Date().getFullYear()} Transcendence</span>
          </footer>
        )}
      </div>
    </div>
  )
}

export const AppRoute = createRoute({
  getParentRoute: () => rootRoute,
  component: AppLayout,
  path: 'app',
})
