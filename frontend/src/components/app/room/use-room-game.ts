import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLiveEvent } from '@/realtime/hooks.ts'
import { useLiveSocket } from '@/realtime/useRealtimeStore.ts'
import type { User } from '@/api/user.ts'
import type { MatchSettings, TetrisState } from '@transcendence/shared'
import type { GamePlayerResult } from '@/realtime/events'
import { usePrediction } from '@/game/tetris/prediction.ts'
import { useTetrisInput } from '@/hooks/use-tetris-input.ts'
import { playBlockPlacedSound } from '@/hooks/use-block-placed-sound.ts'
import { useGameMusic } from '@/hooks/use-game-music.ts'
import { type GamePhase, normalizeGameControls } from './room-game.ts'
import { updateMyPresence } from '@/api/friends.ts'
import { freezePresence, unfreezePresence } from '@/presence/useMyPresence.ts'

export function useRoomGame(
  roomId: string,
  me: User | null | undefined,
  matchSettings?: MatchSettings,
) {
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
  const myUserId = me?.id
  const prediction = usePrediction(matchSettings)
  const predictionRef = useRef(prediction)
  predictionRef.current = prediction
  useGameMusic(gamePhase === 'playing')
  const lastPiecesPlacedRef = useRef(0)

  const [isChatOpen, setIsChatOpen] = useState(false)
  const isChatOpenRef = useRef(false)

  const setChatOpen = useCallback((open: boolean) => {
    isChatOpenRef.current = open
    setIsChatOpen(open)
  }, [])

  const quitRoom = useCallback(() => {
    const sound = new Audio('/sounds/game-effects/cancel_game.mp3')
    sound.play().catch(() => {})
    socket?.emit('room.leave', { roomId })
    setChatOpen(false)
    setTimeout(() => navigate({ to: '/app/room' }).catch(console.error), 150)
  }, [socket, roomId, navigate, setChatOpen])

  useEffect(() => {
    freezePresence()
    updateMyPresence({ status: 'in-room' }).catch(() => {})
    return () => {
      unfreezePresence()
      updateMyPresence({ status: 'online' }).catch(() => {})
    }
  }, [])

  const setPhase = useCallback((phase: GamePhase) => {
    gamePhaseRef.current = phase
    setGamePhase(phase)
    if (phase === 'countdown' || phase === 'playing') {
      updateMyPresence({ status: 'in-game' }).catch(() => {})
    } else {
      updateMyPresence({ status: 'in-room' }).catch(() => {})
    }
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

    // Reconcile local player's predicted state
    if (myUserId && data.players[myUserId]) {
      prediction.reconcile(
        data.players[myUserId],
        data.lastSeq?.[myUserId] ?? 0,
        data.predictionPieces?.[myUserId] ?? [],
      )
    }

    // Play sound for gravity locks detected via server state
    if (myUserId && data.players[myUserId]) {
      const serverPlaced = data.players[myUserId].piecesPlaced
      if (serverPlaced > lastPiecesPlacedRef.current) {
        playBlockPlacedSound()
        lastPiecesPlacedRef.current = serverPlaced
      }
    }

    // Build combined state: predicted for local player, server for opponents
    const predicted = prediction.predictedState.current.predictedState
    if (myUserId && predicted) {
      setPlayerStates({ ...data.players, [myUserId]: predicted })
    } else {
      setPlayerStates(data.players)
    }
  })

  useLiveEvent('game.finished', (data) => {
    if (data.roomId !== roomId) return
    const won = data.results.length > 0 && data.results[0].userId === myUserId
    new Audio(won ? '/sounds/win.mp3' : '/sounds/loose.mp3')
      .play()
      .catch(() => {})
    setPhase('finished')
    setResults(data.results)
  })

  // Input handling (DAS/ARR + escape-hold-to-quit) shared with solo mode
  const { escapeHoldProgress } = useTetrisInput({
    enabled: !!socket,
    controls: me?.gameControls,
    handlingSettings: me?.tetrisHandlingSettings,
    isPlaying: () => gamePhaseRef.current === 'playing',
    emitInput: (action) => {
      const seq = predictionRef.current.applyInput(action)
      socket?.emit('game.input', {
        roomId,
        action,
        ...(seq > 0 ? { seq } : {}),
      })

      // Immediately render the predicted state so the UI doesn't wait for the server round-trip
      const predicted =
        predictionRef.current.predictedState.current.predictedState
      if (myUserId && predicted) {
        if (predicted.piecesPlaced > lastPiecesPlacedRef.current) {
          playBlockPlacedSound()
          lastPiecesPlacedRef.current = predicted.piecesPlaced
        }
        setPlayerStates((prev) => ({ ...prev, [myUserId]: predicted }))
      }
    },
    onEscapeComplete: quitRoom,
    chat: {
      toggleChatKey: normalizeGameControls(me?.gameControls).toggleChat,
      isOpen: () => isChatOpenRef.current,
      setOpen: setChatOpen,
    },
  })

  const handleStartGame = useCallback(
    (onError?: () => void) => {
      if (!socket) return

      socket.emit('game.start', { roomId }, (res) => {
        if (!res.ok) {
          toast.error(res.error || 'Failed to start game')
          onError?.()
        }
      })
    },
    [socket, roomId],
  )

  const handleBackToLobby = useCallback(() => {
    setPhase('lobby')
    setPlayerStates({})
    setResults(null)
    setCountdown(null)
    setChatOpen(false)
    lastPiecesPlacedRef.current = 0
    prediction.reset()
    queryClient.invalidateQueries({ queryKey: ['room', roomId] })
  }, [setPhase, setChatOpen, prediction, queryClient, roomId])

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
