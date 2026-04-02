import { createRoute } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { TwoFactorAuth } from '@/components/TwoFactorAuth.tsx'
import { useGetUser } from '@/api/user.ts'

const Settings = () => {
  const { data: user } = useGetUser()

  if (!user) return null

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <TwoFactorAuth user={user} />
    </div>
  )
}

export const SettingsRoute = createRoute({
  getParentRoute: () => AppRoute,
  path: '/settings',
  component: Settings,
})
