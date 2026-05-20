import { useEffect, useRef } from 'react'
import { TetrisRenderer } from '@/game/tetris/renderer'
import type { TetrisState } from '@/game/tetris/types'

type GameBoardProps = {
  state: TetrisState | null
  label: string
  large?: boolean
}

export function GameBoard({ state, label, large }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<TetrisRenderer | null>(null)
  const holdLabelRef = useRef<HTMLDivElement>(null)
  const nextLabelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new TetrisRenderer(canvas)
    rendererRef.current = renderer

    const updateLabels = () => {
      const l = renderer.getLayout()
      if (holdLabelRef.current) {
        holdLabelRef.current.style.left = `${l.holdX}px`
        holdLabelRef.current.style.top = `${l.holdY - 22}px`
        holdLabelRef.current.style.width = `${l.holdPanelSize}px`
      }
      if (nextLabelRef.current) {
        nextLabelRef.current.style.left = `${l.nextX}px`
        nextLabelRef.current.style.top = `${l.nextY - 22}px`
        nextLabelRef.current.style.width = `${l.nextPanelSize}px`
      }
    }

    const handleResize = () => {
      const container = canvas.parentElement
      if (!container) return
      renderer.resize(container.clientWidth, container.clientHeight)
      updateLabels()
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
      className={`flex flex-col items-center gap-2 ${large ? 'min-h-0 flex-1 justify-center' : ''}`}
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
        className={`relative ${large ? 'w-full max-w-[640px] aspect-[7/10]' : 'w-full max-w-[300px] aspect-[7/10]'}`}
      >
        <canvas ref={canvasRef} className="h-full w-full" />
        <div
          ref={holdLabelRef}
          className="pointer-events-none absolute text-center text-xl font-bold uppercase tracking-widest text-white"
        >
          HOLD
        </div>
        <div
          ref={nextLabelRef}
          className="pointer-events-none absolute text-center text-xl font-bold uppercase tracking-widest text-white"
        >
          NEXT
        </div>
        {state?.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-2xl font-bold text-red-400">GAME OVER</span>
          </div>
        )}
      </div>
    </div>
  )
}
