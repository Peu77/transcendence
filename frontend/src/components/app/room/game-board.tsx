import { useEffect, useRef } from 'react'
import { TetrisRenderer } from '@/game/tetris/renderer'
import { type TetrisState } from '@transcendence/shared'

type GameBoardProps = {
  state: TetrisState | null
  label: string
  large?: boolean
  onLabelClick?: () => void
}

export function GameBoard({
  state,
  label,
  large,
  onLabelClick,
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<TetrisRenderer | null>(null)
  const latestStateRef = useRef<TetrisState | null>(state)
  latestStateRef.current = state

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new TetrisRenderer(canvas)
    rendererRef.current = renderer

    const handleResize = () => {
      const container = canvas.parentElement
      if (!container) return
      renderer.resize(container.clientWidth, container.clientHeight)
      if (latestStateRef.current) renderer.render(latestStateRef.current)
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.destroy()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    if (state && rendererRef.current) {
      rendererRef.current.render(state)
    }
  }, [state])

  if (large) {
    return (
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col items-center justify-center">
        <div className="relative min-h-0 flex-1 w-full">
          <canvas ref={canvasRef} className="h-full w-full" />
          {state?.gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-2xl font-bold text-red-400">GAME OVER</span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-3 text-sm font-bold tracking-wide text-foreground/80">
          <span
            onClick={onLabelClick}
            className={
              onLabelClick
                ? 'cursor-pointer hover:opacity-70 transition-opacity'
                : ''
            }
          >
            {label}
          </span>
          {state && (
            <>
              <span>SCORE {state.score}</span>
              <span>LINES {state.lines}</span>
              <span>LVL {state.level}</span>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <div className="flex shrink-0 gap-2 text-[10px] font-bold tracking-wide text-foreground/80">
        <span
          onClick={onLabelClick}
          className={
            onLabelClick
              ? 'cursor-pointer hover:opacity-70 transition-opacity'
              : ''
          }
        >
          {label}
        </span>
        {state && (
          <>
            <span>SCORE {state.score}</span>
            <span>LINES {state.lines}</span>
            <span>LVL {state.level}</span>
          </>
        )}
      </div>
      <div className="relative w-full aspect-[7/10]">
        <canvas ref={canvasRef} className="h-full w-full" />
        {state?.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-xs font-bold text-red-400">GAME OVER</span>
          </div>
        )}
      </div>
    </div>
  )
}
