import { Button } from '@/components/ui/button.tsx'
import type { Room } from '@/api/room.ts'
import type { GamePlayerResult } from '@/realtime/events'
import type { TetrisState } from '@transcendence/shared'
import { RoomChat } from './room-chat.tsx'
import { GameField } from '@/components/app/game-field.tsx'
import type { GamePhase } from './room-game.ts'

type RoomGamePhaseProps = {
  gamePhase: GamePhase
  countdown: number | null
  playerStates: Record<string, TetrisState>
  results: GamePlayerResult[] | null
  myUserId: string
  room: Room
  isChatOpen: boolean
  escapeHoldProgress: number
  onBackToLobby: () => void
}

export function RoomGamePhase({
  gamePhase,
  countdown,
  playerStates,
  results,
  myUserId,
  room,
  isChatOpen,
  escapeHoldProgress,
  onBackToLobby,
}: RoomGamePhaseProps) {
  const myState = playerStates[myUserId] ?? null

  const getUsernameForId = (userId: string) => {
    return room.users.find((u) => u.id === userId)?.username ?? 'Opponent'
  }

  const opponents = Object.entries(playerStates)
    .filter(([id]) => id !== myUserId)
    .map(([userId, state]) => ({
      userId,
      state,
      label: getUsernameForId(userId),
    }))

  const floatingContent = isChatOpen ? (
    <RoomChat
      roomId={room.id}
      currentUserId={myUserId}
      autoFocus
      className="absolute left-0 top-0 z-20 h-full w-full max-w-sm"
    />
  ) : null

  const overlay = (() => {
    if (gamePhase === 'countdown' && countdown !== null) {
      return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <span className="animate-pulse text-8xl font-bold text-white">
            {countdown === 0 ? 'GO!' : countdown}
          </span>
        </div>
      )
    }
    if (gamePhase === 'finished' && results) {
      return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-black/70">
          <span className="text-5xl font-bold text-cyan-400">GAME OVER</span>
          <div className="flex flex-col items-center gap-2 text-lg text-white/90">
            {results.map((r, i) => (
              <div key={r.userId} className="flex items-center gap-3">
                <span className="text-2xl font-bold text-yellow-300">
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
      )
    }
    return null
  })()

  const instructions =
    gamePhase === 'playing' ? (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm tracking-wide text-foreground/50">
        ARROWS / WASD to move &middot; SPACE to hard drop &middot; T to chat
        &middot; HOLD ESC to quit
      </div>
    ) : null

  return (
    <GameField
      state={myState}
      label="You"
      escapeHoldProgress={escapeHoldProgress}
      opponents={opponents}
      overlay={overlay}
      instructions={instructions}
      floatingContent={floatingContent}
    />
  )
}
