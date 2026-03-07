import { createRoute, Link, useNavigate } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { Button } from '@/components/ui/button.tsx'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getRooms, createRoom } from '@/api/room.ts'
import { toast } from 'sonner'

const Multiplayer = () => {
  const navigate = useNavigate()
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
    refetchInterval: 5000,
  })

  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: async (room) => {
      await navigate({ to: '/app/room/$roomId', params: { roomId: room.id } })
    },
    onError: () => {
      toast.error('Failed to create room')
    },
  })

  interface MenuItem {
    label: string
    description: string
    color: string
    borderColor: string
    textColor: string
    onClick?: () => void
    loading?: boolean
    path?: string
  }

  const menuItems: MenuItem[] = [
    {
      label: 'Create Room',
      description: 'Start a new public match.',
      onClick: () => createRoomMutation.mutate(),
      color: 'bg-pink-400',
      borderColor: 'bg-pink-600',
      textColor: 'text-pink-50',
      loading: createRoomMutation.isPending,
    },
    ...(rooms?.map((room) => ({
      label: `Room ${room.id}`,
      description: `${room.users.length} players waiting.`,
      path: `/app/room/${room.id}`,
      color: 'bg-blue-400',
      borderColor: 'bg-blue-600',
      textColor: 'text-blue-50',
    })) || []),
  ]

  return (
    <div className="w-full flex flex-col items-end pt-10">
      <div className="max-w-[90%] flex flex-col w-full gap-4">
        {isLoading && (
          <div className="text-white text-right pr-10">Loading rooms...</div>
        )}
        {menuItems.map((item, idx) => (
          <div
            key={idx}
            className={`pb-1 pr-1 ${item.borderColor} clip-pixel-corners-btn translate-x-48 hover:translate-x-40 transition-transform w-[calc(100%+12rem)] overflow-hidden`}
          >
            <Button
              asChild={!item.onClick}
              onClick={item.onClick}
              disabled={item.loading}
              className={`justify-start ${item.color} saturate-50 hover:scale-100 py-10 w-full select-none`}
            >
              {item.path ? (
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
              ) : (
                <div
                  className={`flex flex-col items-start justify-center ${item.textColor}`}
                >
                  <span className="font-bold text-4xl">{item.label}</span>
                  <span className="font-normal text-xl">
                    {item.description}
                  </span>
                </div>
              )}
            </Button>
          </div>
        ))}
        {!isLoading && rooms?.length === 0 && (
          <div className="text-white text-right pr-10">
            No public rooms available.
          </div>
        )}
      </div>
    </div>
  )
}

export const MultiplayerRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: Multiplayer,
  path: '/multiplayer',
})
