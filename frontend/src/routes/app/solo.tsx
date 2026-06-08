import { createRoute } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { Button } from '@/components/ui/button.tsx'
import { ArrowLeftIcon } from 'lucide-react'
import { GameBoard } from '@/components/app/room/game-board.tsx'
import { useSoloGame } from '@/hooks/use-solo-game.ts'

const Solo = () => {
  const { phase, countdown, gameState, escapeHoldProgress, restart, quit } =
    useSoloGame()
  const escapeHoldScale = 1 - Math.min(escapeHoldProgress, 1) * 0.18

  return (
    <div className="flex h-full flex-col items-center overflow-hidden">
      {/* Header */}
      <div className="flex w-full max-w-[90%] shrink-0 items-center gap-2 pt-2">
        <Button variant="ghost" size="icon" onClick={quit}>
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-3xl font-bold">Solo</h1>
      </div>

      {/* Countdown state — board visible with overlay */}
      {phase === 'countdown' && gameState && (
        <div className="relative flex min-h-0 w-full flex-1 flex-col items-center py-2">
          <GameBoard state={gameState} label="Solo" large />
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
            <span className="animate-pulse text-8xl font-bold text-white">
              {countdown === 0 ? 'GO!' : countdown}
            </span>
          </div>
        </div>
      )}

      {/* Playing state: game board */}
      {phase === 'playing' && gameState && (
        <div
          className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 py-2 transition-transform duration-75 ease-out"
          style={{ transform: `scale(${escapeHoldScale})` }}
        >
          <GameBoard state={gameState} label="Solo" large />
          <div className="shrink-0 text-sm text-foreground/50">
            Arrow keys to move &middot; Up to rotate &middot; Space to hard drop
            &middot; C to hold &middot; HOLD ESC to quit
          </div>
        </div>
      )}

      {/* Finished state: overlay with stats */}
      {phase === 'finished' && gameState && (
        <div className="relative flex min-h-0 w-full flex-1 flex-col items-center py-2">
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
                  onClick={quit}
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
