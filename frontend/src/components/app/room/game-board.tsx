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
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center gap-6">
        {/* Hold piece — left of board */}
        <div className="flex shrink-0 flex-col items-center gap-3 self-start pt-4">
          <span className="text-sm font-bold uppercase tracking-widest text-foreground/60">
            Hold
          </span>
          <div className="flex min-h-[80px] min-w-[80px] items-center justify-center rounded-lg bg-black/30 p-3">
            {state?.heldPiece ? (
              <PiecePreview
                type={state.heldPiece}
                dimmed={!state.canHold}
                cellSize={30}
              />
            ) : (
              <span className="text-sm text-white/20">---</span>
            )}
          </div>
        </div>

        {/* Board canvas + stats */}
        <div className="relative flex h-full max-h-full flex-col items-center gap-2">
          <div className="relative h-full max-h-full aspect-[1/2]">
            <canvas ref={canvasRef} className="h-full w-full" />
            {state?.gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="text-2xl font-bold text-red-400">GAME OVER</span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-3 text-sm font-bold tracking-wide text-foreground/80">
            <span>{label}</span>
            {state && (
              <>
                <span>SCORE {state.score}</span>
                <span>LINES {state.lines}</span>
                <span>LVL {state.level}</span>
              </>
            )}
          </div>
        </div>

        {/* Next pieces — right of board */}
        {nextPieces.length > 0 && (
          <div className="flex shrink-0 flex-col items-center gap-3 self-start pt-4">
            <span className="text-sm font-bold uppercase tracking-widest text-foreground/60">
              Next
            </span>
            <div className="flex flex-col items-center gap-2 rounded-lg bg-black/30 p-3">
              {nextPieces.map((type, i) => (
                <div key={i} className={i > 0 ? 'opacity-50' : ''}>
                  <PiecePreview type={type} cellSize={30} />
                </div>
              ))}
            </div>
          </div>
        )}
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
