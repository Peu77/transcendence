import { createRoute } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { Button } from '@/components/ui/button.tsx'
import { GameField } from '@/components/app/game-field.tsx'
import { useSoloGame } from '@/hooks/use-solo-game.ts'

const Solo = () => {
  const { phase, countdown, gameState, escapeHoldProgress, restart, quit } =
    useSoloGame()

  const overlay = (() => {
    if (phase === 'countdown') {
      return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <span className="animate-pulse text-8xl font-bold text-white">
            {countdown === 0 ? 'GO!' : countdown}
          </span>
        </div>
      )
    }
    if (phase === 'finished' && gameState) {
      return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
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
      )
    }
    return null
  })()

  const instructions =
    phase === 'playing' ? (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-foreground/50">
        Arrow keys to move &middot; Up to rotate &middot; Space to hard drop
        &middot; C to hold &middot; HOLD ESC to quit
      </div>
    ) : null

  return (
    <GameField
      state={gameState}
      label="Solo"
      escapeHoldProgress={escapeHoldProgress}
      overlay={overlay}
      instructions={instructions}
    />
  )
}

export const SoloRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: Solo,
  path: '/solo',
})
