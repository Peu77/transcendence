import { createRoute, useNavigate } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveSocket } from '@/realtime/useRealtimeStore.ts'
import {
  getRoom,
  RoomType,
  updateMatchSettings,
  updateRoomSettings,
  type MatchSettings,
  type Room,
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
import { DEFAULT_GAME_CONTROLS, type GameControls } from '@/api/user.ts'
import { type RoomSettingsValues } from './room.settings.ts'
import { MatchSettingsForm } from '@/components/app/room/match-settings-form.tsx'
import { RoomPlayersSidebar } from '@/components/app/room/room-players-sidebar.tsx'
import { RoomSettingsForm } from '@/components/app/room/room-settings-form.tsx'
import { TetrisRenderer } from '@/game/tetris/renderer'
import type { TetrisState, InputAction } from '@/game/tetris/types'
import type { GamePlayerResult } from '@/realtime/events'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type GamePhase = 'lobby' | 'countdown' | 'playing' | 'paused' | 'finished'

const buildKeyMap = (controls?: GameControls): Record<string, InputAction> => {
  const normalizedControls = { ...DEFAULT_GAME_CONTROLS, ...controls }

  return Object.entries(normalizedControls).reduce<Record<string, InputAction>>(
    (keyMap, [action, key]) => {
      keyMap[key] = action as InputAction
      return keyMap
    },
    {},
  )
}

/* ------------------------------------------------------------------ */
/*  Game Board component                                               */
/* ------------------------------------------------------------------ */

function GameBoard({
  state,
  label,
  large,
}: {
  state: TetrisState | null
  label: string
  large?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<TetrisRenderer | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new TetrisRenderer(canvas)
    rendererRef.current = renderer

    const handleResize = () => {
      const container = canvas.parentElement
      if (!container) return
      renderer.resize(container.clientWidth, container.clientHeight)
      if (state) renderer.render(state)
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.destroy()
      rendererRef.current = null
    }
  }, [state])

  useEffect(() => {
    if (state && rendererRef.current) {
      rendererRef.current.render(state)
    }
  }, [state])

  return (
    <div
      className={`flex flex-col items-center gap-2 ${large ? 'flex-1' : ''}`}
    >
      <div className="flex gap-4 text-sm font-bold tracking-wide text-foreground/80">
        <span>{label}</span>
        {state && (
          <>
            <span>SCORE {state.score}</span>
            <span>LINES {state.lines}</span>
            <span>LVL {state.level}</span>
          </>
        )}
      </div>
      <div
        className={`relative ${large ? 'w-full max-w-[500px] aspect-[7/10]' : 'w-full max-w-[250px] aspect-[7/10]'}`}
      >
        <canvas ref={canvasRef} className="h-full w-full" />
        {state?.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-2xl font-bold text-red-400">GAME OVER</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Lobby phase (existing settings UI)                                 */
/* ------------------------------------------------------------------ */

function LobbyPhase({
  room,
  isHost,
  onStartGame,
}: {
  room: Room
  isHost: boolean
  onStartGame: () => void
}) {
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
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <RoomPlayersSidebar room={room} currentUserId={me?.id} />

      <section className="flex min-h-0 flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card/95 px-6 py-5 shadow-lg">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Room overview
            </p>
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
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Game phase (dual boards)                                           */
/* ------------------------------------------------------------------ */

function GamePhaseUI({
  gamePhase,
  countdown,
  playerStates,
  results,
  myUserId,
  room,
  onBackToLobby,
}: {
  gamePhase: GamePhase
  countdown: number | null
  playerStates: Record<string, TetrisState>
  results: GamePlayerResult[] | null
  myUserId: string
  room: Room
  onBackToLobby: () => void
}) {
  const myState = playerStates[myUserId] ?? null
  const opponentEntries = Object.entries(playerStates).filter(
    ([id]) => id !== myUserId,
  )

  const getUsernameForId = (userId: string) => {
    return room.users.find((u) => u.id === userId)?.username ?? 'Opponent'
  }

  return (
    <div className="relative flex h-full items-center justify-center gap-8">
      {/* My board (large) */}
      <GameBoard state={myState} label="You" large />

      {/* Opponent boards (smaller) */}
      {opponentEntries.map(([userId, state]) => (
        <GameBoard
          key={userId}
          state={state}
          label={getUsernameForId(userId)}
        />
      ))}

      {/* Countdown overlay */}
      {gamePhase === 'countdown' && countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <span className="animate-pulse text-8xl font-bold text-white">
            {countdown === 0 ? 'GO!' : countdown}
          </span>
        </div>
      )}

      {/* Paused overlay */}
      {gamePhase === 'paused' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/60 z-10">
          <span className="text-5xl font-bold text-yellow-300">PAUSED</span>
          <span className="text-sm text-white/50">Press ESC to resume</span>
        </div>
      )}

      {/* Finished overlay */}
      {gamePhase === 'finished' && results && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/70 z-10">
          <span className="text-5xl font-bold text-cyan-400">GAME OVER</span>
          <div className="flex flex-col items-center gap-2 text-lg text-white/90">
            {results.map((r, i) => (
              <div key={r.userId} className="flex items-center gap-3">
                <span className="font-bold text-2xl text-yellow-300">
                  #{i + 1}
                </span>
                <span className="font-semibold">{r.username}</span>
                <span className="text-white/60">
                  Score: {r.score} | Lines: {r.lines} | Lvl: {r.level}
                </span>
              </div>
            ))}
          </div>
          <Button
            onClick={onBackToLobby}
            className="mt-4 bg-cyan-500 px-8 py-4 text-xl font-bold text-white hover:bg-cyan-400"
          >
            BACK TO LOBBY
          </Button>
        </div>
      )}

      {/* Controls hint */}
      {gamePhase === 'playing' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm tracking-wide text-foreground/50">
          ARROWS / WASD to move &middot; SPACE to hard drop &middot; ESC to
          pause
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

const RoomPage = () => {
  const { roomId } = RoomRoute.useParams()
  const socket = useLiveSocket()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(true)
  const me = userStore.state

  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby')
  const gamePhaseRef = useRef<GamePhase>('lobby')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [playerStates, setPlayerStates] = useState<Record<string, TetrisState>>(
    {},
  )
  const [results, setResults] = useState<GamePlayerResult[] | null>(null)

  const setPhase = useCallback((p: GamePhase) => {
    gamePhaseRef.current = p
    setGamePhase(p)
  }, [])

  const {
    data: room,
    error: fetchError,
    isLoading: isRoomLoading,
  } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => getRoom(roomId),
    enabled: !!roomId && !isJoining,
  })

  useLiveEvent('room.updated', async () => {
    await queryClient.invalidateQueries({ queryKey: ['room', roomId] })
  })

  // Game event listeners
  useLiveEvent('game.countdown', (data) => {
    if (data.roomId !== roomId) return
    setPhase('countdown')
    setCountdown(data.count)
  })

  useLiveEvent('game.state', (data) => {
    if (data.roomId !== roomId) return
    if (
      gamePhaseRef.current === 'countdown' ||
      gamePhaseRef.current === 'lobby'
    ) {
      setPhase('playing')
    }
    setPlayerStates(data.players)
  })

  useLiveEvent('game.paused', (data) => {
    if (data.roomId !== roomId) return
    setPhase('paused')
    setPlayerStates(data.players)
  })

  useLiveEvent('game.resumed', (data) => {
    if (data.roomId !== roomId) return
    setPhase('playing')
    setPlayerStates(data.players)
  })

  useLiveEvent('game.finished', (data) => {
    if (data.roomId !== roomId) return
    setPhase('finished')
    setResults(data.results)
  })

  // Join room on mount
  useEffect(() => {
    if (!socket || !roomId) return

    setIsJoining(true)
    setJoinError(null)

    socket.emit('room.join', { roomId }, (res) => {
      setIsJoining(false)
      if (!res.ok) {
        setJoinError(res.error || 'Failed to join room')
      }
    })

    return () => {
      socket.emit('room.leave', { roomId })
    }
  }, [socket, roomId])

  // Navigate away on error
  useEffect(() => {
    if (!joinError && !fetchError) return

    const errorMessage = joinError || (fetchError as Error)?.message
    if (errorMessage) {
      toast.error(errorMessage)
    }

    navigate({ to: '/app/room' }).catch(console.error)
  }, [fetchError, joinError, navigate])

  // Keyboard input for game
  useEffect(() => {
    const keyMap = buildKeyMap(me?.gameControls)

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentPhase = gamePhaseRef.current

      if (e.key === 'Escape') {
        e.preventDefault()
        if (currentPhase === 'playing') {
          socket.emit('game.pause', { roomId })
        } else if (currentPhase === 'paused') {
          socket.emit('game.resume', { roomId })
        }
        return
      }

      if (currentPhase !== 'playing') return
      const action = keyMap[e.key]
      if (action) {
        e.preventDefault()
        socket.emit('game.input', { roomId, action })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [socket, roomId, me?.gameControls])

  const handleStartGame = useCallback(() => {
    socket.emit('game.start', { roomId }, (res) => {
      if (!res.ok) {
        toast.error(res.error || 'Failed to start game')
      }
    })
  }, [socket, roomId])

  const handleBackToLobby = useCallback(() => {
    setPhase('lobby')
    setPlayerStates({})
    setResults(null)
    setCountdown(null)
    queryClient.invalidateQueries({ queryKey: ['room', roomId] })
  }, [setPhase, queryClient, roomId])

  const isHost = room?.hostUserId === me?.id
  const error = joinError || (fetchError as Error)?.message

  if (error) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden p-6 text-foreground">
        Redirecting to room lobby...
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
      {gamePhase === 'lobby' ? (
        <LobbyPhase room={room} isHost={isHost} onStartGame={handleStartGame} />
      ) : (
        <GamePhaseUI
          gamePhase={gamePhase}
          countdown={countdown}
          playerStates={playerStates}
          results={results}
          myUserId={me?.id ?? ''}
          room={room}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  )
}

export const RoomRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: RoomPage,
  path: '/room/$roomId',
})
