import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import {
  RoomType,
  updateMatchSettings,
  updateRoomSettings,
  type MatchSettings,
  type Room,
} from '@/api/room.ts'
import { userStore } from '@/store/userStore'
import { type RoomSettingsValues } from '@/routes/app/room.settings.ts'
import { MatchSettingsForm } from './match-settings-form.tsx'
import { RoomPlayersSidebar } from './room-players-sidebar.tsx'
import { RoomSettingsForm } from './room-settings-form.tsx'
import { RoomChat } from './room-chat.tsx'

type RoomLobbyPhaseProps = {
  room: Room
  isHost: boolean
  onStartGame: () => void
}

export function RoomLobbyPhase({
  room,
  isHost,
  onStartGame,
}: RoomLobbyPhaseProps) {
  const me = userStore.state
  const queryClient = useQueryClient()

  const updateMatchMutation = useMutation({
    mutationFn: (settings: MatchSettings) =>
      updateMatchSettings(room.id, settings),
    onSuccess: async () => {
      toast.success('Match settings updated')
      await queryClient.invalidateQueries({ queryKey: ['room', room.id] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update match settings')
    },
  })

  const updateRoomMutation = useMutation({
    mutationFn: (update: { type: RoomType }) =>
      updateRoomSettings(room.id, update),
    onSuccess: async () => {
      toast.success('Room settings updated')
      await queryClient.invalidateQueries({ queryKey: ['room', room.id] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update room settings')
    },
  })

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
      <RoomPlayersSidebar room={room} currentUserId={me?.id} />

      <section className="flex min-h-0 flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card/95 px-6 py-5 shadow-lg">
          <div className="flex gap-2 justify-center ">
            <h1 className="text-3xl font-bold xl:text-4xl">Room: {room.id}</h1>
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
              onClick={onStartGame}
            >
              START GAME
            </Button>
          )}
        </div>
      </section>

      <RoomChat roomId={room.id} currentUserId={me?.id} />
    </div>
  )
}
