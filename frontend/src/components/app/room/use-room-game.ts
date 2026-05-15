import { useCallback, useEffect, useRef, useState } from 'react'
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
  const queryClient = useQueryClient()
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby')
  const gamePhaseRef = useRef<GamePhase>('lobby')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [playerStates, setPlayerStates] = useState<Record<string, TetrisState>>(
    {},
  )
  const [results, setResults] = useState<GamePlayerResult[] | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const isChatOpenRef = useRef(false)

  const setChatOpen = useCallback((open: boolean) => {
    isChatOpenRef.current = open
    setIsChatOpen(open)
  }, [])

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

  useLiveEvent('game.paused', (data) => {
    if (data.roomId !== roomId) return
    setPhase('paused')
    setPlayerStates(data.players)
  })

  useLiveEvent('game.resumed', (data) => {
    if (data.roomId !== roomId) return
    setPhase('playing')
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
        if (isChatOpenRef.current) {
          setChatOpen(false)
          return
        }
        if (currentPhase === 'playing') {
          socket.emit('game.pause', { roomId })
        } else if (currentPhase === 'paused') {
          socket.emit('game.resume', { roomId })
        }
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
  }, [
    socket,
    roomId,
    me?.gameControls,
    me?.tetrisHandlingSettings,
    setChatOpen,
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
    handleStartGame,
    handleBackToLobby,
  }
}
