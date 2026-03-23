import { createRoute, redirect } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'

export const RoomLobbyRoute = createRoute({
  getParentRoute: () => AppRoute,
  path: '/room',
  beforeLoad: () => {
    throw redirect({ to: '/app/multiplayer' })
  },
})
