import { useCallback, useRef } from 'react'
import { createRoute, Link } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { Button } from '@/components/ui/button.tsx'

const Index = () => {
  const hoverSoundRef = useRef<HTMLAudioElement | null>(null)
  const onMenuHover = useCallback(() => {
    if (!hoverSoundRef.current) {
      hoverSoundRef.current = new Audio('/sounds/menu_hover.mp3')
    }
    hoverSoundRef.current.currentTime = 0
    hoverSoundRef.current.play().catch(() => {})
  }, [])
  const items: {
    label: string
    description: string
    path: string
    color: string
    borderColor: string
    textColor: string
  }[] = [
    {
      label: 'multiplayer',
      description: 'Play against other players in real-time matches.',
      path: '/app/multiplayer',
      color: 'bg-cyan-400',
      borderColor: 'bg-cyan-600',
      textColor: 'text-cyan-50',
    },
    {
      label: 'solo',
      description: 'Practice your skills against AI opponents.',
      path: '/app/solo',
      color: 'bg-green-400',
      borderColor: 'bg-green-600',
      textColor: 'text-green-50',
    },
    {
      label: 'stats',
      description:
        'Your stats, achievements, match history and the global ranking.',
      path: '/app/statistics',
      color: 'bg-orange-400',
      borderColor: 'bg-orange-600',
      textColor: 'text-orange-50',
    },
    {
      label: 'achievements',
      description: 'Track your milestones and unlock rewards.',
      path: '/app/achievements',
      color: 'bg-violet-400',
      borderColor: 'bg-violet-600',
      textColor: 'text-violet-50',
    },
    {
      label: 'settings',
      description: 'Customize your experience and preferences.',
      path: '/app/settings',
      color: 'bg-blue-400',
      borderColor: 'bg-blue-600',
      textColor: 'text-blue-50',
    },
    {
      label: 'about',
      description: 'Learn more about the Transcendence project.',
      path: '/app/about',
      color: 'bg-yellow-400',
      borderColor: 'bg-yellow-600',
      textColor: 'text-yellow-50',
    },
  ]

  return (
    <div className="w-full flex flex-col items-end pt-10">
      <div className="max-w-[90%] flex flex-col w-full gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            onMouseEnter={onMenuHover}
            className={`pb-1 pr-1 ${item.borderColor} clip-pixel-corners-btn translate-x-48 hover:translate-x-40 transition-transform w-[calc(100%+12rem)] overflow-hidden`}
          >
            <Button
              asChild={true}
              className={` justify-start ${item.color} saturate-50 hover:scale-100 py-10 w-full select-none`}
              key={item.label}
            >
              <Link to={item.path}>
                <div
                  className={`flex flex-col items-start justify-center ${item.textColor}`}
                >
                  <span className="font-bold text-4xl">{item.label}</span>
                  <span className="font-normal text-xl">
                    {item.description}
                  </span>
                </div>
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export const AppIndexRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: Index,
  path: '/',
})
