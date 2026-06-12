import { createRoute } from '@tanstack/react-router'
import { GameField } from '@/components/app/game-field.tsx'
import { SoloSettingsPanel } from '@/components/app/solo-settings-panel.tsx'
import { Button } from '@/components/ui/button.tsx'
import { useSoloGame } from '@/hooks/use-solo-game.ts'
import { AppRoute } from '@/routes/app/layout.tsx'
import { ScreenSupportGate } from '@/components/app/screen-support-gate.tsx'

const Solo = () => {
  const {
    phase,
    countdown,
    gameState,
    escapeHoldProgress,
    restart,
    quit,
    settings,
    updateSettings,
  } = useSoloGame()

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
              <Button
                silent
                onClick={restart}
                className="h-auto px-8 py-3 text-lg"
              >
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
      <div className="absolute inset-x-0 bottom-4 text-center text-sm text-foreground/50">
        Use your Tetris keybinds &middot; R to reset &middot; Hover the right
        card for live settings &middot; HOLD ESC to quit
      </div>
    ) : null

  const floatingContent = (
    <SoloSettingsPanel
      settings={settings}
      onChange={updateSettings}
      onRestart={restart}
    />
  )

  return (
    <GameField
      state={gameState}
      label="Solo"
      escapeHoldProgress={escapeHoldProgress}
      overlay={overlay}
      instructions={instructions}
      floatingContent={floatingContent}
    />
  )
}

export const SoloRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: () => (
    <ScreenSupportGate>
      <Solo />
    </ScreenSupportGate>
  ),
  path: '/solo',
})
