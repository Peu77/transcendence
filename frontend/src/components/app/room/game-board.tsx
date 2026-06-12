import { useEffect, useRef, useState } from 'react'
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

  const prevComboRef = useRef(-1)
  const comboKeyRef = useRef(0)
  const [comboEvent, setComboEvent] = useState<{
    count: number
    key: number
  } | null>(null)
  const [holdLayout, setHoldLayout] = useState<{
    x: number
    y: number
    dim: number
    nextX: number
  } | null>(null)

  useEffect(() => {
    if (!large) return
    const combo = state?.combo ?? -1
    const prev = prevComboRef.current
    prevComboRef.current = combo
    if (combo > prev && combo >= 1) {
      comboKeyRef.current++
      setComboEvent({ count: combo + 1, key: comboKeyRef.current })
    }
  }, [state?.combo, large])

  useEffect(() => {
    if (!large) return
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!container) return

    const compute = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      // Mirror renderer layout constants
      const cs = Math.floor(Math.min((w - 40) / 14, (h - 16) / 20))
      const pcs = Math.floor(cs * 0.5)
      const dim = pcs * 4
      const boardOffX = (w - cs * 10) / 2
      setHoldLayout({
        x: boardOffX - 20 - dim,
        y: (h - cs * 20) / 2,
        dim,
        nextX: boardOffX + cs * 10 + 20,
      })
    }

    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(container)
    return () => observer.disconnect()
  }, [large])

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

          {comboEvent && (
            <div
              key={comboEvent.key}
              className="combo-pop absolute left-1/2 top-[30%] pointer-events-none text-center whitespace-nowrap"
              style={{ transform: 'translateX(-50%)' }}
              onAnimationEnd={() => setComboEvent(null)}
            >
              <div
                className="text-5xl font-bold text-orange-400 leading-none"
                style={{ textShadow: '0 0 16px rgba(251,146,60,0.9)' }}
              >
                x{comboEvent.count}
              </div>
              <div
                className="text-xl tracking-[0.25em] text-orange-200"
                style={{ textShadow: '0 0 8px rgba(251,146,60,0.6)' }}
              >
                COMBO
              </div>
            </div>
          )}

          {holdLayout && (
            <>
              <div
                className="absolute pointer-events-none text-center text-sm font-bold tracking-widest text-foreground/60"
                style={{
                  left: holdLayout.x,
                  width: holdLayout.dim,
                  top: holdLayout.y,
                  transform: 'translateY(-100%)',
                }}
              >
                HOLD
              </div>
              <div
                className="absolute pointer-events-none text-center text-sm font-bold tracking-widest text-foreground/60"
                style={{
                  left: holdLayout.nextX,
                  width: holdLayout.dim,
                  top: holdLayout.y,
                  transform: 'translateY(-100%)',
                }}
              >
                NEXT
              </div>
            </>
          )}

          {state && state.b2bChain > 0 && holdLayout && (
            <div
              className="absolute pointer-events-none text-center leading-tight"
              style={{
                left: holdLayout.x,
                top: holdLayout.y + holdLayout.dim + 6,
                width: holdLayout.dim,
              }}
            >
              <div
                className="text-sm text-amber-400"
                style={{ textShadow: '0 0 6px rgba(251,191,36,0.8)' }}
              >
                B2B
              </div>
              <div
                className="text-2xl font-bold text-amber-300"
                style={{ textShadow: '0 0 10px rgba(251,191,36,0.7)' }}
              >
                ×{state.b2bChain}
              </div>
            </div>
          )}

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
