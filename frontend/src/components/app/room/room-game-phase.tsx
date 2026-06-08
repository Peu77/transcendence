import { useState } from 'react'
import { Button } from '@/components/ui/button.tsx'
import type { Room } from '@/api/room.ts'
import type { GamePlayerResult } from '@/realtime/events'
import type { TetrisState } from '@transcendence/shared'
import { GameBoard } from './game-board.tsx'
import { RoomChat } from './room-chat.tsx'
import type { GamePhase } from './room-game.ts'
import { ProfileDialog } from '@/components/app/profileDialog.tsx'

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
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  const myState = playerStates[myUserId] ?? null
  const opponentEntries = Object.entries(playerStates).filter(
    ([id]) => id !== myUserId,
  )
  const escapeHoldScale = 1 - Math.min(escapeHoldProgress, 1) * 0.18

  const getUsernameForId = (userId: string) => {
    return room.users.find((u) => u.id === userId)?.username ?? 'Opponent'
  }

  return (
    <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden">
      <ProfileDialog
        userId={profileUserId ?? ''}
        open={profileUserId !== null}
        onOpenChange={(open) => { if (!open) setProfileUserId(null) }}
      />
      {isChatOpen && (
        <RoomChat
          roomId={room.id}
          currentUserId={myUserId}
          autoFocus
          className="absolute left-0 top-0 z-20 h-full w-full max-w-sm"
        />
      )}

      <div
        className="flex h-full min-h-0 w-full items-stretch gap-4 px-4 py-4 transition-transform duration-75 ease-out"
        style={{ transform: `scale(${escapeHoldScale})` }}
      >
        {/* Own board — takes most of the space */}
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
          <GameBoard state={myState} label="You" large />
        </div>

        {/* Opponents — small grid on the right */}
        {opponentEntries.length > 0 && (
          <div className="flex w-48 shrink-0 flex-col gap-3 overflow-y-auto py-2">
            {opponentEntries.map(([userId, state]) => (
              <GameBoard
                key={userId}
                state={state}
                label={getUsernameForId(userId)}
                onLabelClick={() => setProfileUserId(userId)}
              />
            ))}
          </div>
        )}
      </div>

      {gamePhase === 'countdown' && countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <span className="animate-pulse text-8xl font-bold text-white">
            {countdown === 0 ? 'GO!' : countdown}
          </span>
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
                <button
                  onClick={() => setProfileUserId(r.userId)}
                  className="font-semibold hover:opacity-70 transition-opacity cursor-pointer"
                >
                  {r.username}
                </button>
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
          ARROWS / WASD to move &middot; SPACE to hard drop &middot; T to chat
          &middot; HOLD ESC to quit
        </div>
      )}
    </div>
  )
}
