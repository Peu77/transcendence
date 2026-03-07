import { createRoute } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { useEffect, useState } from 'react'
import { useLiveSocket } from '@/realtime/useRealtimeStore.ts'
import {
  getRoom,
  RoomType,
  updateMatchSettings,
  updateRoomSettings,
  type MatchSettings,
} from '@/api/room.ts'
import { toast } from 'sonner'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useLiveEvent } from '@/realtime/hooks.ts'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import { Button } from '@/components/ui/button.tsx'
import { userStore } from '@/store/userStore'
import { type RoomSettingsValues } from './room.settings.ts'
import { MatchSettingsForm } from '@/components/app/room/match-settings-form.tsx'
import { RoomPlayersSidebar } from '@/components/app/room/room-players-sidebar.tsx'
import { RoomSettingsForm } from '@/components/app/room/room-settings-form.tsx'

const RoomPage = () => {
  const { roomId } = RoomRoute.useParams()
  const socket = useLiveSocket()
  const queryClient = useQueryClient()
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(true)
  const me = userStore.state

  const {
    data: room,
    error: fetchError,
    isLoading: isRoomLoading,
  } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => getRoom(roomId),
    enabled: !!roomId && !isJoining,
  })

  const updateMatchMutation = useMutation({
    mutationFn: (settings: MatchSettings) =>
      updateMatchSettings(roomId, settings),
    onSuccess: async () => {
      toast.success('Match settings updated')
      await queryClient.invalidateQueries({ queryKey: ['room', roomId] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update match settings')
    },
  })

  const updateRoomMutation = useMutation({
    mutationFn: (update: { type: RoomType }) =>
      updateRoomSettings(roomId, update),
    onSuccess: async () => {
      toast.success('Room settings updated')
      await queryClient.invalidateQueries({ queryKey: ['room', roomId] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update room settings')
    },
  })

  useLiveEvent('room.updated', async () => {
    console.log('Room updated event received, refetching...')
    await queryClient.invalidateQueries({ queryKey: ['room', roomId] })
  })

  useEffect(() => {
    if (!socket || !roomId) return

    setIsJoining(true)
    setJoinError(null)

    socket.emit('room.join', { roomId }, (res) => {
      setIsJoining(false)
      if (!res.ok) {
        setJoinError(res.error || 'Failed to join room')
        toast.error(res.error || 'Failed to join room')
      }
    })

    return () => {
      socket.emit('room.leave', { roomId })
    }
  }, [socket, roomId])

  const isHost = room?.hostUserId === me?.id
  const error = joinError || (fetchError as Error)?.message

  if (error) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden p-6 text-foreground">
        <div className="w-full max-w-2xl rounded-2xl border border-destructive/40 bg-card/95 p-8 shadow-lg">
          <h1 className="mb-4 text-4xl font-bold">Error</h1>
          <p className="text-xl text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  if (isRoomLoading || isJoining || !room) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden p-6 text-foreground">
        Joining room {roomId}...
      </div>
    )
  }

  return (
    <div className="h-[calc(100dvh-4rem)] overflow-hidden p-4 text-foreground md:p-6">
      <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <RoomPlayersSidebar room={room} currentUserId={me?.id} />

        <section className="flex min-h-0 flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card/95 px-6 py-5 shadow-lg">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Room overview
              </p>
              <h1 className="text-3xl font-bold xl:text-4xl">
                Room: {room.id}
              </h1>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card/95 p-6 shadow-lg">
            <Tabs defaultValue="match" className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-border/70 pb-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold">Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    Configure the match and room without leaving the lobby.
                  </p>
                </div>
                <TabsList className="mt-4 grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="match">Match Settings</TabsTrigger>
                  <TabsTrigger value="room">Room Settings</TabsTrigger>
                </TabsList>
              </div>

              <div className="mt-4 min-h-0 flex-1 overflow-hidden">
                <TabsContent value="match" className="mt-0 h-full">
                  <MatchSettingsForm
                    room={room}
                    isHost={isHost}
                    isSaving={updateMatchMutation.isPending}
                    onSave={(settings) => updateMatchMutation.mutate(settings)}
                  />
                </TabsContent>

                <TabsContent value="room" className="mt-0 h-full">
                  <RoomSettingsForm
                    room={room}
                    isHost={isHost}
                    isSaving={updateRoomMutation.isPending}
                    onSave={(data: RoomSettingsValues) =>
                      updateRoomMutation.mutate(data)
                    }
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <div className="flex justify-center pb-1">
            {isHost && (
              <Button
                type="button"
                size="lg"
                className="min-w-56 bg-green-600 font-bold text-white hover:bg-green-700"
              >
                START GAME
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export const RoomRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: RoomPage,
  path: '/room/$roomId',
})
