import { createRoute, useNavigate } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { Button } from '@/components/ui/button.tsx'
import { ArrowLeftIcon } from 'lucide-react'
import { GameBoard } from '@/components/app/room/game-board.tsx'
import { useSoloGame } from '@/hooks/use-solo-game.ts'

const Solo = () => {
  const navigate = useNavigate()
  const { phase, gameState, start, restart, quit } = useSoloGame()

  return (
    <div className="flex h-full flex-col items-center">
      {/* Header */}
      <div className="flex w-full max-w-[90%] shrink-0 items-center gap-2 pt-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            quit()
            navigate({ to: '/app' })
          }}
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-3xl font-bold">Solo</h1>
      </div>

      {/* Idle state: START button */}
      {phase === 'idle' && (
        <div className="flex flex-1 items-center justify-center">
          <Button
            onClick={start}
            className="px-12 py-8 text-3xl font-bold"
          >
            START
          </Button>
        </div>
      )}

      {/* Playing state: game board */}
      {phase === 'playing' && gameState && (
        <div className="flex min-h-0 flex-1 flex-col items-center gap-2 py-2">
          <GameBoard state={gameState} label="Solo" large />
          <div className="shrink-0 text-sm text-foreground/50">
            Arrow keys to move &middot; Up to rotate &middot; Space to hard
            drop &middot; C to hold &middot; ESC to quit
          </div>
        </div>
      )}

      {/* Finished state: overlay with stats */}
      {phase === 'finished' && gameState && (
        <div className="relative flex min-h-0 flex-1 flex-col items-center py-2">
          <GameBoard state={gameState} label="Solo" large />
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="flex flex-col items-center gap-6 rounded-lg bg-background/90 p-8">
              <h2 className="text-3xl font-bold text-red-400">GAME OVER</h2>
              <div className="flex gap-8 text-lg font-semibold">
                <span>Score: {gameState.score}</span>
                <span>Lines: {gameState.lines}</span>
                <span>Level: {gameState.level}</span>
              </div>
              <div className="flex gap-4">
                <Button onClick={restart} className="h-auto px-8 py-3 text-lg">
                  PLAY AGAIN
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: '/app' })}
                  className="h-auto px-8 py-3 text-lg"
                >
                  MAIN MENU
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const SoloRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: Solo,
  path: '/solo',
})
