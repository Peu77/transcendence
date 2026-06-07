import { useEffect, useRef } from 'react'
import { TetrisRenderer } from '@/game/tetris/renderer'
import {
  TETROMINOES,
  type TetrisState,
  type TetrominoType,
} from '@transcendence/shared'

const PIECE_CSS_COLORS: Record<string, string> = {
  I: 'bg-cyan-400',
  O: 'bg-yellow-400',
  T: 'bg-purple-600',
  S: 'bg-green-500',
  Z: 'bg-red-500',
  J: 'bg-blue-600',
  L: 'bg-orange-500',
}

function PiecePreview({
  type,
  dimmed,
  cellSize = 10,
}: {
  type: TetrominoType
  dimmed?: boolean
  cellSize?: number
}) {
  const blocks = TETROMINOES[type][0]
  const minR = Math.min(...blocks.map(([r]) => r))
  const maxR = Math.max(...blocks.map(([r]) => r))
  const minC = Math.min(...blocks.map(([, c]) => c))
  const maxC = Math.max(...blocks.map(([, c]) => c))
  const rows = maxR - minR + 1
  const cols = maxC - minC + 1

  return (
    <div
      className={`grid gap-px ${dimmed ? 'opacity-40' : ''}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
      }}
    >
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols) + minR
        const c = (i % cols) + minC
        const filled = blocks.some(([br, bc]) => br === r && bc === c)
        return (
          <div
            key={i}
            className={`rounded-[1px] ${filled ? PIECE_CSS_COLORS[type] : 'bg-transparent'}`}
          />
        )
      })}
    </div>
  )
}

type GameBoardProps = {
  state: TetrisState | null
  label: string
  large?: boolean
}

export function GameBoard({ state, label, large }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<TetrisRenderer | null>(null)
  const latestStateRef = useRef<TetrisState | null>(state)
  latestStateRef.current = state

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new TetrisRenderer(canvas)
    if (large) renderer.compact = true
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
  }, [large])

  useEffect(() => {
    if (state && rendererRef.current) {
      rendererRef.current.render(state)
    }
  }, [state])

  if (large) {
    const nextPieces = state?.nextPieces?.length
      ? state.nextPieces
      : state?.nextPiece
        ? [state.nextPiece]
        : []

    return (
      <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center">
        {/* Hold piece — top-left */}
        {state && (
          <div className="absolute left-0 top-0 flex flex-col items-center gap-1 p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
              Hold
            </span>
            {state.heldPiece ? (
              <PiecePreview
                type={state.heldPiece}
                dimmed={!state.canHold}
                cellSize={14}
              />
            ) : (
              <div className="h-8 w-14" />
            )}
          </div>
        )}

        {/* Next pieces — top-right */}
        {nextPieces.length > 0 && (
          <div className="absolute right-0 top-0 flex flex-col items-center gap-2 p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
              Next
            </span>
            {nextPieces.map((type, i) => (
              <PiecePreview key={i} type={type} cellSize={14} />
            ))}
          </div>
        )}

        {/* Stats bar */}
        <div className="absolute left-0 bottom-0 flex shrink-0 gap-3 p-2 text-sm font-bold tracking-wide text-foreground/80">
          <span>{label}</span>
          {state && (
            <>
              <span>SCORE {state.score}</span>
              <span>LINES {state.lines}</span>
              <span>LVL {state.level}</span>
            </>
          )}
        </div>

        {/* Board canvas */}
        <div className="relative h-full max-h-full aspect-[1/2]">
          <canvas ref={canvasRef} className="h-full w-full" />
          {state?.gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-2xl font-bold text-red-400">GAME OVER</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <div className="flex shrink-0 gap-2 text-[10px] font-bold tracking-wide text-foreground/80">
        <span>{label}</span>
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
