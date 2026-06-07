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

  const holdLabelRef = useRef<HTMLDivElement>(null)
  const nextLabelRef = useRef<HTMLDivElement>(null)
  const b2bRef = useRef<HTMLDivElement>(null)
  const comboRef = useRef<HTMLDivElement>(null)

  const prevComboRef = useRef<number>(-1)
  const prevB2bRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new TetrisRenderer(canvas)
    if (large) renderer.compact = true
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

      const belowHold = l.holdY + l.holdPanelSize + 12
      if (b2bRef.current) {
        b2bRef.current.style.left = `${l.holdX}px`
        b2bRef.current.style.top = `${belowHold}px`
        b2bRef.current.style.width = `${l.holdPanelSize}px`
      }
      if (comboRef.current) {
        comboRef.current.style.left = `${l.holdX}px`
        comboRef.current.style.top = `${belowHold + 48}px`
        comboRef.current.style.width = `${l.holdPanelSize}px`
      }
    }

    const handleResize = () => {
      const container = canvas.parentElement
      if (!container) return
      renderer.resize(container.clientWidth, container.clientHeight)
      updateLabels()
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

    if (!large || !state) return

    const combo = state.combo
    const b2b = state.b2bChain

    if (combo !== prevComboRef.current && comboRef.current) {
      comboRef.current.classList.remove('combo-pop')
      void comboRef.current.offsetWidth
      comboRef.current.classList.add('combo-pop')
    }
    prevComboRef.current = combo

    if (b2b !== prevB2bRef.current && b2bRef.current) {
      b2bRef.current.classList.remove('b2b-pop')
      void b2bRef.current.offsetWidth
      b2bRef.current.classList.add('b2b-pop')
    }
    prevB2bRef.current = b2b
  }, [state, large])

  const showCombo = large && state && state.combo >= 1
  const showB2b = large && state && state.b2bChain >= 1

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

        {/* B2B indicator */}
        {showB2b && (
          <div className="absolute left-0 top-24 flex flex-col items-center p-2">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              B2B
            </span>
            {state && state.b2bChain >= 2 && (
              <span className="text-lg font-black text-cyan-200 leading-tight">
                ×{state.b2bChain}
              </span>
            )}
          </div>
        )}

        {/* Combo counter */}
        {showCombo && (
          <div className="absolute left-0 top-36 flex flex-col items-center p-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              COMBO
            </span>
            {state && state.combo >= 1 && (
              <span className="text-2xl font-black text-amber-200 leading-tight">
                ×{state.combo + 1}
              </span>
            )}
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
    <>
      <style>{`
        @keyframes combo-appear {
          0%   { transform: scale(1.4); opacity: 1; }
          60%  { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(1.0); opacity: 1; }
        }
        @keyframes b2b-appear {
          0%   { transform: scale(1.2); opacity: 1; }
          60%  { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(1.0); opacity: 1; }
        }
        .combo-pop { animation: combo-appear 0.25s ease-out forwards; }
        .b2b-pop   { animation: b2b-appear 0.2s ease-out forwards; }
      `}</style>

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

          {/* B2B indicator — positioned below hold panel via JS */}
          <div
            ref={b2bRef}
            className="pointer-events-none absolute flex flex-col items-center"
            style={{ visibility: showB2b ? 'visible' : 'hidden' }}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              B2B
            </span>
            {state && state.b2bChain >= 2 && (
              <span className="text-lg font-black text-cyan-200 leading-tight">
                ×{state.b2bChain}
              </span>
            )}
          </div>

          {/* Combo counter — positioned below B2B via JS */}
          <div
            ref={comboRef}
            className="pointer-events-none absolute flex flex-col items-center"
            style={{ visibility: showCombo ? 'visible' : 'hidden' }}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              COMBO
            </span>
            {state && state.combo >= 1 && (
              <span className="text-2xl font-black text-amber-200 leading-tight">
                ×{state.combo + 1}
              </span>
            )}
          </div>

          {state?.gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-xs font-bold text-red-400">GAME OVER</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
