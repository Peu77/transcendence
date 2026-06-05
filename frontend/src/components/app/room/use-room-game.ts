import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLiveEvent } from '@/realtime/hooks.ts'
import { useLiveSocket } from '@/realtime/useRealtimeStore.ts'
import type { User } from '@/api/user.ts'
import type { TetrisState, InputAction } from '@/game/tetris/types'
import type { GamePlayerResult } from '@/realtime/events'
import {
  buildKeyMap,
  normalizeGameControls,
  normalizeHandlingSettings,
  type GamePhase,
} from './room-game.ts'

export function useRoomGame(roomId: string, me: User | null | undefined) {
  const socket = useLiveSocket()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby')
  const gamePhaseRef = useRef<GamePhase>('lobby')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [playerStates, setPlayerStates] = useState<Record<string, TetrisState>>(
    {},
  )
  const [results, setResults] = useState<GamePlayerResult[] | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [escapeHoldProgress, setEscapeHoldProgress] = useState(0)
  const isChatOpenRef = useRef(false)

  const setChatOpen = useCallback((open: boolean) => {
    isChatOpenRef.current = open
    setIsChatOpen(open)
  }, [])

  const quitRoom = useCallback(() => {
    socket?.emit('room.leave', { roomId })
    setChatOpen(false)
    navigate({ to: '/app/room' }).catch(console.error)
  }, [socket, roomId, navigate, setChatOpen])

  const setPhase = useCallback((phase: GamePhase) => {
    gamePhaseRef.current = phase
    setGamePhase(phase)
  }, [])

  useLiveEvent('game.countdown', (data) => {
    if (data.roomId !== roomId) return
    setPhase('countdown')
    setCountdown(data.count)
  })

  useLiveEvent('game.state', (data) => {
    if (data.roomId !== roomId) return
    if (
      gamePhaseRef.current === 'countdown' ||
      gamePhaseRef.current === 'lobby'
    ) {
      setPhase('playing')
    }
    setPlayerStates(data.players)
  })

  useLiveEvent('game.finished', (data) => {
    if (data.roomId !== roomId) return
    setPhase('finished')
    setResults(data.results)
  })

  useEffect(() => {
    if (!socket) return

    const keyMap = buildKeyMap(me?.gameControls)
    const gameControls = normalizeGameControls(me?.gameControls)
    const handlingSettings = normalizeHandlingSettings(
      me?.tetrisHandlingSettings,
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

    const emitInput = (action: InputAction) => {
      socket.emit('game.input', { roomId, action })
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
        quitRoom()
      }, escapeHoldDuration)
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
      const currentPhase = gamePhaseRef.current

      if (e.key === 'Escape') {
        e.preventDefault()
        if (!e.repeat && isChatOpenRef.current) {
          setChatOpen(false)
        }
        if (!e.repeat) startEscapeHold()
        return
      }

      if (currentPhase !== 'playing') return
      if (e.key === gameControls.toggleChat && !isChatOpenRef.current) {
        e.preventDefault()
        setChatOpen(true)
        return
      }

      if (isChatOpenRef.current) return

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
  }, [
    socket,
    roomId,
    me?.gameControls,
    me?.tetrisHandlingSettings,
    setChatOpen,
    quitRoom,
  ])

  const handleStartGame = useCallback(() => {
    if (!socket) return

    socket.emit('game.start', { roomId }, (res) => {
      if (!res.ok) {
        toast.error(res.error || 'Failed to start game')
      }
    })
  }, [socket, roomId])

  const handleBackToLobby = useCallback(() => {
    setPhase('lobby')
    setPlayerStates({})
    setResults(null)
    setCountdown(null)
    setChatOpen(false)
    queryClient.invalidateQueries({ queryKey: ['room', roomId] })
  }, [setPhase, setChatOpen, queryClient, roomId])

  return {
    gamePhase,
    countdown,
    playerStates,
    results,
    isChatOpen,
    escapeHoldProgress,
    handleLeaveRoom: quitRoom,
    handleStartGame,
    handleBackToLobby,
  }
}
