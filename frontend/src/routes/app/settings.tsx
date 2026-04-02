import { createRoute, useRouter } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { TwoFactorAuth } from '@/components/TwoFactorAuth.tsx'
import { useGetUser } from '@/api/user.ts'
import { Button } from '@/components/ui/button.tsx'
import { ArrowLeftIcon } from 'lucide-react'

const Settings = () => {
  const { data: user } = useGetUser()
  const router = useRouter()

  if (!user) return null

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.history.back()}
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <TwoFactorAuth user={user} />
    </div>
  )
}

export const SettingsRoute = createRoute({
  getParentRoute: () => AppRoute,
  path: '/settings',
  component: Settings,
})
