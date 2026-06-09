import ReactDOM from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx'
import { getQueryContext } from './integrations/tanstack-query/query-context.ts'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'

import { Toaster } from '@/components/ui/sonner.tsx'
import Login from '@/routes/auth/login.tsx'
import Register from '@/routes/auth/register.tsx'
import Home from '@/routes/home.tsx'
import { AppRoute } from '@/routes/app/layout.tsx'
import { AppIndexRoute } from '@/routes/app/app.tsx'
import { SettingsRoute } from '@/routes/app/settings.tsx'
import { MultiplayerRoute } from '@/routes/app/multiplayer.tsx'
import { SoloRoute } from '@/routes/app/solo.tsx'
import { RoomLobbyRoute } from '@/routes/app/room.tsx'
import { RoomRoute } from '@/routes/app/room.$roomId.tsx'
import { AboutRoute } from '@/routes/app/about.tsx'
import { NotFound } from '@/routes/notFound.tsx'
import { StatisticsRoute } from '@/routes/app/statistics.tsx'

export const rootRoute = createRootRoute<unknown>({
  component: () => (
    <>
      <Toaster />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
  notFoundComponent: () => <div>404 - Not Found</div>,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  createRoute({
    getParentRoute: () => rootRoute,
    component: Login,
    path: 'login',
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    component: Register,
    path: 'register',
  }),
  AppRoute,
  AppIndexRoute,
  SettingsRoute,
  MultiplayerRoute,
  SoloRoute,
  RoomLobbyRoute,
  RoomRoute,
  AboutRoute,
  StatisticsRoute,
])

const TanStackQueryProviderContext = getQueryContext()
const router = createRouter({
  defaultNotFoundComponent: NotFound,
  routeTree,
  context: {
    ...TanStackQueryProviderContext,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
      <RouterProvider router={router} />
    </TanStackQueryProvider.Provider>,
  )
}

reportWebVitals()
