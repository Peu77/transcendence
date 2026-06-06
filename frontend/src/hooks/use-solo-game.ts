import { useCallback, useEffect, useRef, useState } from 'react'
import { TetrisGame } from '@transcendence/shared'
import type { TetrisState, InputAction, MatchSettings } from '@transcendence/shared'
import { useStore } from '@tanstack/react-store'
import { userStore } from '@/store/userStore.ts'
import {
  buildKeyMap,
  normalizeHandlingSettings,
} from '@/components/app/room/room-game.ts'

export type SoloPhase = 'idle' | 'playing' | 'finished'

export function useSoloGame() {
  const user = useStore(userStore)
  const [phase, setPhase] = useState<SoloPhase>('idle')
  const [gameState, setGameState] = useState<TetrisState | null>(null)

  const gameRef = useRef<TetrisGame | null>(null)
  const tickTimerRef = useRef<number | null>(null)
  const phaseRef = useRef<SoloPhase>('idle')
  const lastLevelRef = useRef(1)

  const clearTick = useCallback(() => {
    if (tickTimerRef.current !== null) {
      window.clearInterval(tickTimerRef.current)
      tickTimerRef.current = null
    }
  }, [])

  const updateState = useCallback(() => {
    const game = gameRef.current
    if (!game) return
    setGameState(game.getState())
  }, [])

  const startTickLoop = useCallback(() => {
    clearTick()
    const game = gameRef.current
    if (!game) return

    lastLevelRef.current = game.level

    tickTimerRef.current = window.setInterval(() => {
      const alive = game.tick()
      updateState()

      if (!alive) {
        clearTick()
        phaseRef.current = 'finished'
        setPhase('finished')
        return
      }

      // Restart interval when level changes (tick speed increases)
      if (game.level !== lastLevelRef.current) {
        startTickLoop()
      }
    }, game.getTickInterval())
  }, [clearTick, updateState])

  const start = useCallback(() => {
    clearTick()
    const game = new TetrisGame({
      garbage: { enabled: false } as MatchSettings['garbage'],
    })
    gameRef.current = game
    lastLevelRef.current = 1
    phaseRef.current = 'playing'
    setPhase('playing')
    setGameState(game.getState())
    startTickLoop()
  }, [clearTick, startTickLoop])

  const restart = useCallback(() => {
    start()
  }, [start])

  const quit = useCallback(() => {
    clearTick()
    gameRef.current = null
    phaseRef.current = 'idle'
    setPhase('idle')
    setGameState(null)
  }, [clearTick])

  // Input handling with DAS/ARR
  useEffect(() => {
    const keyMap = buildKeyMap(user?.gameControls)
    const handlingSettings = normalizeHandlingSettings(
      user?.tetrisHandlingSettings,
    )
    const pressedActions = new Set<InputAction>()
    const timers: Partial<
      Record<InputAction, { delay?: number; repeat?: number }>
    > = {}

    const clearActionTimers = (action: InputAction) => {
      const actionTimers = timers[action]
      if (actionTimers?.delay) window.clearTimeout(actionTimers.delay)
      if (actionTimers?.repeat) window.clearInterval(actionTimers.repeat)
      delete timers[action]
    }

    const clearHorizontalTimers = () => {
      clearActionTimers('left')
      clearActionTimers('right')
    }

    const emitInput = (action: InputAction) => {
      const game = gameRef.current
      if (!game || game.gameOver) return
      game.processInput(action)
      setGameState(game.getState())
    }

    const startHorizontalRepeat = (action: 'left' | 'right') => {
      clearHorizontalTimers()
      const oppositeAction = action === 'left' ? 'right' : 'left'
      pressedActions.delete(oppositeAction)
      pressedActions.add(action)
      emitInput(action)

      timers[action] = {
        delay: window.setTimeout(() => {
          emitInput(action)
          timers[action] = {
            repeat: window.setInterval(
              () => emitInput(action),
              Math.max(handlingSettings.arr, 16),
            ),
          }
        }, handlingSettings.das + handlingSettings.dcd),
      }
    }

    const startSoftDropRepeat = () => {
      if (pressedActions.has('softDrop')) return
      pressedActions.add('softDrop')
      emitInput('softDrop')
      timers.softDrop = {
        repeat: window.setInterval(
          () => emitInput('softDrop'),
          Math.max(handlingSettings.sdf, 16),
        ),
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (phaseRef.current !== 'playing') return

      if (e.key === 'Escape') {
        e.preventDefault()
        if (!e.repeat) quit()
        return
      }

      const action = keyMap[e.key]
      if (!action) return

      e.preventDefault()

      if (action === 'left' || action === 'right') {
        if (!pressedActions.has(action)) startHorizontalRepeat(action)
        return
      }

      if (action === 'softDrop') {
        startSoftDropRepeat()
        return
      }

      if (!e.repeat) emitInput(action)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const action = keyMap[e.key]
      if (!action) return

      if (action === 'left' || action === 'right' || action === 'softDrop') {
        pressedActions.delete(action)
        clearActionTimers(action)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      for (const action of Object.keys(timers) as InputAction[]) {
        clearActionTimers(action)
      }
    }
  }, [user?.gameControls, user?.tetrisHandlingSettings, quit])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTick()
    }
  }, [clearTick])

  return {
    phase,
    gameState,
    start,
    restart,
    quit,
  }
}
