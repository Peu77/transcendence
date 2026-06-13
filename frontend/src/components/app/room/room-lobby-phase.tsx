import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button.tsx'
import { Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import {
  type MatchSettings,
  type Room,
  RoomType,
  updateMatchSettings,
  updateRoomSettings,
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
  onLeaveRoom: () => void
  onStartGame: (onError?: () => void) => void
}

export function RoomLobbyPhase({
  room,
  isHost,
  onLeaveRoom,
  onStartGame,
}: RoomLobbyPhaseProps) {
  const me = userStore.state
  const queryClient = useQueryClient()
  const [isStarting, setIsStarting] = useState(false)
  const gameStartSoundRef = useRef<HTMLAudioElement | null>(null)

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
    <div className="grid h-full min-h-0 overflow-hidden border-border/70 bg-background/95 xl:grid-cols-[360px_minmax(0,1fr)_400px]">
      <RoomPlayersSidebar
        room={room}
        currentUserId={me?.id}
        onLeaveRoom={onLeaveRoom}
      />

      <section className="flex min-h-0 flex-col border-x border-border/70 px-8  xl:px-10">
        <div className="border-b border-border/70 pb-8">
          <div className="flex flex-wrap items-start justify-center gap-4 sm:justify-between">
            <h2 className="text-3xl font-bold uppercase tracking-wide xl:text-4xl">
              Room: {room.id}
            </h2>
            {isHost && (
              <Button
                type="button"
                size="lg"
                silent
                disabled={isStarting || room.users.length < 2}
                className="flex min-w-56 gap-2 bg-green-600 font-bold uppercase tracking-wide text-white hover:bg-green-700 disabled:opacity-80"
                onClick={() => {
                  if (!gameStartSoundRef.current) {
                    gameStartSoundRef.current = new Audio(
                      '/sounds/game_start.mp3',
                    )
                  }
                  gameStartSoundRef.current.currentTime = 0
                  gameStartSoundRef.current.play().catch(() => {})
                  setIsStarting(true)
                  onStartGame(() => setIsStarting(false))
                }}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    STARTING…
                  </>
                ) : (
                  'START GAME'
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col pt-8">
          <Tabs defaultValue="match" className="flex min-h-0 flex-1 flex-col">
            <div className="">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold uppercase tracking-wide">
                  Settings
                </h2>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  Configure the match and room without leaving the lobby.
                </p>
              </div>
              <TabsList className="mt-7 grid h-12 w-full max-w-md grid-cols-2 bg-transparent p-0">
                <TabsTrigger value="match">Match Settings</TabsTrigger>
                <TabsTrigger value="room">Room Settings</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="mt-8 min-h-0 flex-1 relative">
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
            </ScrollArea>
          </Tabs>
        </div>
      </section>

      <RoomChat roomId={room.id} currentUserId={me?.id} />
    </div>
  )
}
