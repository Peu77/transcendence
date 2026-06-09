import type { ReactNode } from 'react'
import type { TetrisState } from '@transcendence/shared'
import { GameBoard } from '@/components/app/room/game-board.tsx'

type Opponent = {
  userId: string
  state: TetrisState
  label: string
}

type GameFieldProps = {
  state: TetrisState | null
  label: string
  escapeHoldProgress: number
  opponents?: Opponent[]
  overlay?: ReactNode
  instructions?: ReactNode
  floatingContent?: ReactNode
}

export function GameField({
  state,
  label,
  escapeHoldProgress,
  opponents,
  overlay,
  instructions,
  floatingContent,
}: GameFieldProps) {
  const escapeHoldScale = 1 - Math.min(escapeHoldProgress, 1) * 0.18

  return (
    <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden">
      {floatingContent}

      <div
        className="flex h-full min-h-0 w-full items-stretch gap-4 px-4 py-4 transition-transform duration-75 ease-out"
        style={{ transform: `scale(${escapeHoldScale})` }}
      >
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
          <GameBoard state={state} label={label} large />
        </div>

        {opponents && opponents.length > 0 && (
          <div className="flex w-48 shrink-0 flex-col gap-3 overflow-y-auto py-2">
            {opponents.map((opponent) => (
              <GameBoard
                key={opponent.userId}
                state={opponent.state}
                label={opponent.label}
              />
            ))}
          </div>
        )}
      </div>

      {overlay}
      {instructions}
    </div>
  )
}
