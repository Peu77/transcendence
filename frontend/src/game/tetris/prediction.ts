import { useCallback, useRef } from 'react'
import {
  TetrisGame,
  type InputAction,
  type MatchSettings,
  type TetrisState,
  type TetrominoType,
} from '@transcendence/shared'

interface PendingInput {
  seq: number
  action: InputAction
}

export function usePrediction(settings?: Partial<MatchSettings>) {
  const ref = useRef<{
    localGame: TetrisGame | null
    inputBuffer: PendingInput[]
    seqCounter: number
    predictedState: TetrisState | null
  }>({
    localGame: null,
    inputBuffer: [],
    seqCounter: 0,
    predictedState: null,
  })

  // Keep settings in a separate ref so reconcile always sees the latest value
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const applyInput = useCallback((action: InputAction): number => {
    const engine = ref.current
    if (!engine.localGame) return 0

    const seq = ++engine.seqCounter
    engine.localGame.processInput(action)
    engine.inputBuffer.push({ seq, action })
    engine.predictedState = engine.localGame.getState()
    return seq
  }, [])

  const reconcile = useCallback(
    (
      serverState: TetrisState,
      lastSeq: number,
      extraPieces: TetrominoType[],
    ) => {
      const engine = ref.current

      // Initialize local game on first server state
      if (!engine.localGame) {
        if (!settingsRef.current) return
        engine.localGame = new TetrisGame(settingsRef.current)
      }

      // Discard acknowledged inputs
      engine.inputBuffer = engine.inputBuffer.filter((i) => i.seq > lastSeq)

      // Snap to server truth
      engine.localGame.restoreFromState(serverState, extraPieces)

      // Replay pending inputs (only if the game isn't over)
      if (!serverState.gameOver) {
        for (const { action } of engine.inputBuffer) {
          engine.localGame.processInput(action)
        }
      }

      engine.predictedState = engine.localGame.getState()
    },
    [],
  )

  const reset = useCallback(() => {
    ref.current = {
      localGame: null,
      inputBuffer: [],
      seqCounter: 0,
      predictedState: null,
    }
  }, [])

  return { applyInput, reconcile, predictedState: ref, reset }
}
