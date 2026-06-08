import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { TetrisGame } from '@transcendence/shared'
import type { TetrisState, MatchSettings } from '@transcendence/shared'
import { useStore } from '@tanstack/react-store'
import { userStore } from '@/store/userStore.ts'
import { useTetrisInput } from '@/hooks/use-tetris-input.ts'

export type SoloPhase = 'countdown' | 'playing' | 'finished'

export function useSoloGame() {
  const user = useStore(userStore)
  const navigate = useNavigate()
  const [phase, setPhase] = useState<SoloPhase>('countdown')
  const [countdown, setCountdown] = useState<number>(3)
  const [gameState, setGameState] = useState<TetrisState | null>(null)

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
    navigate({ to: '/app' })
  }, [clearTick, clearCountdown, navigate])

  // Input handling (DAS/ARR + escape-hold-to-quit) shared with multiplayer
  const { escapeHoldProgress } = useTetrisInput({
    controls: user?.gameControls,
    handlingSettings: user?.tetrisHandlingSettings,
    isPlaying: () => phaseRef.current === 'playing',
    emitInput: (action) => {
      const game = gameRef.current
      if (!game || game.gameOver) return
      game.processInput(action)
      setGameState(game.getState())
    },
    onEscapeComplete: quit,
  })

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
