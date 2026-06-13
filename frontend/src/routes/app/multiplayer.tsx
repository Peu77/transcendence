import { createRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useRef, useState } from 'react'
import { AppRoute } from '@/routes/app/layout.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createRoom, getRooms } from '@/api/room.ts'
import { toast } from 'sonner'
import { ArrowLeftIcon } from 'lucide-react'

const Multiplayer = () => {
  const navigate = useNavigate()
  const [roomIdInput, setRoomIdInput] = useState('')
  const hoverSoundRef = useRef<HTMLAudioElement | null>(null)
  const onMenuHover = useCallback(() => {
    if (!hoverSoundRef.current) {
      hoverSoundRef.current = new Audio('/sounds/menu_hover.mp3')
    }
    hoverSoundRef.current.currentTime = 0
    hoverSoundRef.current.play().catch(() => {})
  }, [])
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
  })

  const joinRoomById = async () => {
    const trimmedRoomId = roomIdInput.trim().toUpperCase()
    if (!trimmedRoomId) {
      toast.error('Enter a room ID to join')
      return
    }

    await navigate({
      to: '/app/room/$roomId',
      params: { roomId: trimmedRoomId },
    })
  }

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
    <div className="w-full flex flex-col items-center sm:items-end pt-10">
      <div className="max-w-[90%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] flex flex-col w-full gap-4">
        <div className="flex items-center translate-x-0 sm:translate-x-48 w-full sm:w-[calc(100%+12rem)] gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate({
                to: '/app',
              })
            }
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Multiplayer</h1>
        </div>
        <form
          className="translate-x-0 sm:translate-x-48 w-full sm:w-[calc(100%+12rem)]"
          onSubmit={async (e) => {
            e.preventDefault()
            await joinRoomById()
          }}
        >
          <Label htmlFor="join-room-id" className="sr-only">
            Room ID
          </Label>
          <Input
            id="join-room-id"
            name="room-id"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            placeholder="Paste a room ID and press Enter to join"
            autoComplete="off"
            className="w-full"
          />
        </form>

        {isLoading && (
          <div className="text-white text-center sm:text-right sm:pr-10">
            Loading rooms...
          </div>
        )}
        {menuItems.map((item) => (
          <div
            key={item.path ?? item.label}
            onMouseEnter={onMenuHover}
            className={`pb-1 pr-1 ${item.borderColor} clip-pixel-corners-btn translate-x-0 sm:translate-x-48 sm:hover:translate-x-40 transition-transform w-full sm:w-[calc(100%+12rem)] overflow-hidden`}
          >
            <Button
              asChild={!item.onClick}
              onClick={item.onClick}
              disabled={item.loading}
              className={`justify-start ${item.color} saturate-50 hover:scale-100 py-8 sm:py-10 w-full select-none`}
            >
              {item.path ? (
                <Link to={item.path}>
                  <div
                    className={`flex flex-col items-start justify-center ${item.textColor}`}
                  >
                    <span className="font-bold text-2xl sm:text-4xl">
                      {item.label}
                    </span>
                    <span className="font-normal text-lg sm:text-xl">
                      {item.description}
                    </span>
                  </div>
                </Link>
              ) : (
                <div
                  className={`flex flex-col items-start justify-center ${item.textColor}`}
                >
                  <span className="font-bold text-2xl sm:text-4xl">
                    {item.label}
                  </span>
                  <span className="font-normal text-lg sm:text-xl">
                    {item.description}
                  </span>
                </div>
              )}
            </Button>
          </div>
        ))}
        {!isLoading && rooms?.length === 0 && (
          <div className="text-white text-center sm:text-right sm:pr-10">
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
