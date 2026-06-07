import { useCallback, useEffect, useRef, useState } from 'react'
import { TetrisGame } from '@transcendence/shared'
import type { TetrisState, InputAction, MatchSettings } from '@transcendence/shared'
import { useStore } from '@tanstack/react-store'
import { userStore } from '@/store/userStore.ts'
import {
  buildKeyMap,
  normalizeHandlingSettings,
} from '@/components/app/room/room-game.ts'

export type SoloPhase = 'countdown' | 'playing' | 'finished'

export function useSoloGame() {
  const user = useStore(userStore)
  const [phase, setPhase] = useState<SoloPhase>('countdown')
  const [countdown, setCountdown] = useState<number>(3)
  const [gameState, setGameState] = useState<TetrisState | null>(null)

  const [escapeHoldProgress, setEscapeHoldProgress] = useState(0)

  const gameRef = useRef<TetrisGame | null>(null)
  const tickTimerRef = useRef<number | null>(null)
  const phaseRef = useRef<SoloPhase>('countdown')
  const lastLevelRef = useRef(1)
  const countdownTimerRef = useRef<number | null>(null)

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

  const clearCountdown = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }, [])

  const startGame = useCallback(() => {
    clearCountdown()
    // Game instance already created during countdown
    if (!gameRef.current) {
      const game = new TetrisGame({
        garbage: { enabled: false } as MatchSettings['garbage'],
      })
      gameRef.current = game
      lastLevelRef.current = 1
      setGameState(game.getState())
    }
    phaseRef.current = 'playing'
    setPhase('playing')
    startTickLoop()
  }, [clearCountdown, startTickLoop])

  const startCountdown = useCallback(() => {
    clearTick()
    clearCountdown()
    const game = new TetrisGame({
      garbage: { enabled: false } as MatchSettings['garbage'],
    })
    gameRef.current = game
    lastLevelRef.current = 1
    phaseRef.current = 'countdown'
    setPhase('countdown')
    setGameState(game.getState())
    setCountdown(3)

    let count = 3
    countdownTimerRef.current = window.setInterval(() => {
      count--
      if (count <= 0) {
        clearCountdown()
        setCountdown(0)
        startGame()
      } else {
        setCountdown(count)
      }
    }, 1000)
  }, [clearTick, clearCountdown, startGame])

  const restart = useCallback(() => {
    startCountdown()
  }, [startCountdown])

  const quit = useCallback(() => {
    clearTick()
    clearCountdown()
    gameRef.current = null
    phaseRef.current = 'countdown'
    setPhase('countdown')
    setGameState(null)
    setCountdown(3)
  }, [clearTick, clearCountdown])

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
    const escapeHoldDuration = 900
    const escapeHoldAnimationDelay = 180
    let escapeHoldStart = 0
    let escapeHoldFrame: number | null = null
    let escapeHoldTimer: number | null = null
    let escapeHoldAnimationTimer: number | null = null

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

    const cancelEscapeHold = () => {
      if (escapeHoldFrame !== null) window.cancelAnimationFrame(escapeHoldFrame)
      if (escapeHoldTimer !== null) window.clearTimeout(escapeHoldTimer)
      if (escapeHoldAnimationTimer !== null) {
        window.clearTimeout(escapeHoldAnimationTimer)
      }
      escapeHoldFrame = null
      escapeHoldTimer = null
      escapeHoldAnimationTimer = null
      escapeHoldStart = 0
      setEscapeHoldProgress(0)
    }

    const tickEscapeHold = () => {
      if (!escapeHoldStart) return
      const progress = Math.min(
        (performance.now() - escapeHoldStart) / escapeHoldDuration,
        1,
      )
      setEscapeHoldProgress(progress)
      if (progress < 1) {
        escapeHoldFrame = window.requestAnimationFrame(tickEscapeHold)
      }
    }

    const startEscapeHold = () => {
      if (escapeHoldStart) return
      escapeHoldStart = performance.now()
      escapeHoldAnimationTimer = window.setTimeout(() => {
        escapeHoldAnimationTimer = null
        if (!escapeHoldStart) return
        tickEscapeHold()
      }, escapeHoldAnimationDelay)
      escapeHoldTimer = window.setTimeout(() => {
        setEscapeHoldProgress(1)
        quit()
      }, escapeHoldDuration)
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
        if (!e.repeat) startEscapeHold()
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
      if (e.key === 'Escape') {
        e.preventDefault()
        cancelEscapeHold()
        return
      }

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
      cancelEscapeHold()
    }
  }, [user?.gameControls, user?.tetrisHandlingSettings, quit])

  // Auto-start countdown on mount
  useEffect(() => {
    startCountdown()
    return () => {
      clearTick()
      clearCountdown()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    phase,
    countdown,
    gameState,
    escapeHoldProgress,
    restart,
    quit,
  }
}
