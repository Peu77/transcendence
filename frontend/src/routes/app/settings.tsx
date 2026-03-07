import { createRoute } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { useQuery } from '@tanstack/react-query'
import { getUser } from '@/api/user.ts'
import { TwoFactorAuth } from '@/components/TwoFactorAuth.tsx'

const Settings = () => {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  })

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
