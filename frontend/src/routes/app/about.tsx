import { createRoute } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'

const About = () => {
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-6xl font-bold text-foreground">about page</h1>
    </div>
  )
}

export const AboutRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: About,
  path: '/about',
})
