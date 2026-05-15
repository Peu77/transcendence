import { Button } from '@/components/ui/button.tsx'
import type { Room } from '@/api/room.ts'
import type { GamePlayerResult } from '@/realtime/events'
import type { TetrisState } from '@/game/tetris/types'
import { GameBoard } from './game-board.tsx'
import type { GamePhase } from './room-game.ts'

type RoomGamePhaseProps = {
  gamePhase: GamePhase
  countdown: number | null
  playerStates: Record<string, TetrisState>
  results: GamePlayerResult[] | null
  myUserId: string
  room: Room
  onBackToLobby: () => void
}

export function RoomGamePhase({
  gamePhase,
  countdown,
  playerStates,
  results,
  myUserId,
  room,
  onBackToLobby,
}: RoomGamePhaseProps) {
  const myState = playerStates[myUserId] ?? null
  const opponentEntries = Object.entries(playerStates).filter(
    ([id]) => id !== myUserId,
  )

  const getUsernameForId = (userId: string) => {
    return room.users.find((u) => u.id === userId)?.username ?? 'Opponent'
  }

  return (
    <div className="relative flex h-full items-center justify-center gap-8">
      <GameBoard state={myState} label="You" large />

      {opponentEntries.map(([userId, state]) => (
        <GameBoard
          key={userId}
          state={state}
          label={getUsernameForId(userId)}
        />
      ))}

      {gamePhase === 'countdown' && countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <span className="animate-pulse text-8xl font-bold text-white">
            {countdown === 0 ? 'GO!' : countdown}
          </span>
        </div>
      )}

      {gamePhase === 'paused' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/60 z-10">
          <span className="text-5xl font-bold text-yellow-300">PAUSED</span>
          <span className="text-sm text-white/50">Press ESC to resume</span>
        </div>
      )}

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

      {gamePhase === 'playing' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm tracking-wide text-foreground/50">
          ARROWS / WASD to move &middot; SPACE to hard drop &middot; ESC to
          pause
        </div>
      )}
    </div>
  )
}
