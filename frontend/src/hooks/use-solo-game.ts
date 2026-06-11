import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { InputAction, TetrisState } from '@transcendence/shared'
import { TetrisGame } from '@transcendence/shared'
import { useStore } from '@tanstack/react-store'
import { isGameInputElement, RESTART_SOLO_KEY } from '@/game/keyboard.ts'
import {
  areSoloMatchSettingsEqual,
  createSoloMatchSettings,
  DEFAULT_SOLO_MATCH_SETTINGS,
  type SoloMatchSettings,
} from '@/game/solo-settings.ts'
import { useTetrisInput } from '@/hooks/use-tetris-input.ts'
import { playBlockPlacedSound } from '@/hooks/use-block-placed-sound.ts'
import { useGameMusic } from '@/hooks/use-game-music.ts'
import { userStore } from '@/store/userStore.ts'

let gameStartSound: HTMLAudioElement | null = null
function getGameStartSound() {
  if (!gameStartSound) gameStartSound = new Audio('/sounds/game_start.mp3')
  return gameStartSound
}

export type SoloPhase = 'countdown' | 'playing' | 'finished'

const SETTINGS_RESTART_DELAY_MS = 180

export function useSoloGame() {
  const user = useStore(userStore)
  const navigate = useNavigate()
  const [phase, setPhase] = useState<SoloPhase>('countdown')
  const [countdown, setCountdown] = useState<number>(3)
  const [gameState, setGameState] = useState<TetrisState | null>(null)
  const [settings, setSettings] = useState<SoloMatchSettings>(
    DEFAULT_SOLO_MATCH_SETTINGS,
  )

  useGameMusic(phase === 'playing')

  const gameRef = useRef<TetrisGame | null>(null)
  const lastPiecesPlacedRef = useRef(0)
  const tickTimerRef = useRef<number | null>(null)
  const phaseRef = useRef<SoloPhase>('countdown')
  const lastLevelRef = useRef(1)
  const countdownTimerRef = useRef<number | null>(null)
  const settingsRestartTimerRef = useRef<number | null>(null)
  const settingsRef = useRef<SoloMatchSettings>(DEFAULT_SOLO_MATCH_SETTINGS)
  const blowbackCarryRef = useRef(0)

  const clearTick = useCallback(() => {
    if (tickTimerRef.current !== null) {
      window.clearInterval(tickTimerRef.current)
      tickTimerRef.current = null
    }
  }, [])

  const clearCountdown = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }, [])

  const clearScheduledRestart = useCallback(() => {
    if (settingsRestartTimerRef.current !== null) {
      window.clearTimeout(settingsRestartTimerRef.current)
      settingsRestartTimerRef.current = null
    }
  }, [])

  const updateState = useCallback(() => {
    const game = gameRef.current
    if (!game) return
    setGameState(game.getState())
  }, [])

  const createGame = useCallback(() => {
    const game = new TetrisGame(createSoloMatchSettings(settingsRef.current))
    gameRef.current = game
    lastLevelRef.current = 1
    lastPiecesPlacedRef.current = 0
    blowbackCarryRef.current = 0
    setGameState(game.getState())
    return game
  }, [])

  const applyBlowbackGarbage = useCallback(() => {
    const game = gameRef.current
    if (!game) return

    const outgoingGarbage = game.collectOutgoingGarbage()
    if (outgoingGarbage <= 0) return

    const totalReturn =
      blowbackCarryRef.current +
      (outgoingGarbage * settingsRef.current.blowbackPercent) / 100
    const returnedGarbage = Math.floor(totalReturn)

    blowbackCarryRef.current = totalReturn - returnedGarbage

    if (returnedGarbage > 0) {
      game.receiveGarbage(returnedGarbage)
    }
  }, [])

  const startTickLoop = useCallback(() => {
    clearTick()
    const game = gameRef.current
    if (!game) return

    lastLevelRef.current = game.level

    tickTimerRef.current = window.setInterval(() => {
      const prevPlaced = game.piecesPlaced
      const alive = game.tick()
      applyBlowbackGarbage()
      updateState()

      if (game.piecesPlaced > prevPlaced) playBlockPlacedSound()

      if (!alive) {
        clearTick()
        new Audio('/sounds/loose.mp3').play().catch(() => {})
        phaseRef.current = 'finished'
        setPhase('finished')
        return
      }

      if (game.level !== lastLevelRef.current) {
        startTickLoop()
      }
    }, game.getTickInterval())
  }, [applyBlowbackGarbage, clearTick, updateState])

  const startGame = useCallback(() => {
    clearCountdown()

    if (!gameRef.current) {
      createGame()
    }

    phaseRef.current = 'playing'
    setPhase('playing')
    startTickLoop()
  }, [clearCountdown, createGame, startTickLoop])

  const startCountdown = useCallback(() => {
    clearTick()
    clearCountdown()
    clearScheduledRestart()
    createGame()

    const sound = getGameStartSound()
    sound.currentTime = 0
    sound.play().catch(() => {})

    phaseRef.current = 'countdown'
    setPhase('countdown')
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
  }, [clearTick, clearCountdown, clearScheduledRestart, createGame, startGame])

  const restart = useCallback(() => {
    startCountdown()
  }, [startCountdown])

  const scheduleSettingsRestart = useCallback(() => {
    clearScheduledRestart()
    settingsRestartTimerRef.current = window.setTimeout(() => {
      settingsRestartTimerRef.current = null
      startCountdown()
    }, SETTINGS_RESTART_DELAY_MS)
  }, [clearScheduledRestart, startCountdown])

  const updateSettings = useCallback(
    (nextSettings: SoloMatchSettings) => {
      if (areSoloMatchSettingsEqual(settingsRef.current, nextSettings)) return

      settingsRef.current = nextSettings
      setSettings(nextSettings)
      scheduleSettingsRestart()
    },
    [scheduleSettingsRestart],
  )

  const quit = useCallback(() => {
    const sound = new Audio('/sounds/game-effects/cancel_game.mp3')
    sound.play().catch(() => {})
    clearTick()
    clearCountdown()
    clearScheduledRestart()
    gameRef.current = null
    setTimeout(() => navigate({ to: '/app' }), 150)
  }, [clearTick, clearCountdown, clearScheduledRestart, navigate])

  const emitInput = useCallback(
    (action: InputAction) => {
      const game = gameRef.current
      if (!game || game.gameOver) return

      const prevPlaced = game.piecesPlaced
      game.processInput(action)
      applyBlowbackGarbage()
      setGameState(game.getState())

      if (game.piecesPlaced > prevPlaced) playBlockPlacedSound()
    },
    [applyBlowbackGarbage],
  )

  const { escapeHoldProgress } = useTetrisInput({
    controls: user?.gameControls,
    handlingSettings: user?.tetrisHandlingSettings,
    isPlaying: () => phaseRef.current === 'playing',
    emitInput,
    onEscapeComplete: quit,
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (isGameInputElement(event.target)) return
      if (event.key.toLowerCase() !== RESTART_SOLO_KEY) return

      event.preventDefault()
      restart()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [restart])

  useEffect(() => {
    startCountdown()
    return () => {
      clearTick()
      clearCountdown()
      clearScheduledRestart()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    phase,
    countdown,
    gameState,
    escapeHoldProgress,
    restart,
    quit,
    settings,
    updateSettings,
  }
}
