import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getRoom } from '@/api/room.ts'
import { useLiveEvent } from '@/realtime/hooks.ts'
import { useLiveSocket } from '@/realtime/useRealtimeStore.ts'

export function useRoomSession(roomId: string) {
  const socket = useLiveSocket()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(true)

  const {
    data: room,
    error: fetchError,
    isLoading: isRoomLoading,
  } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => getRoom(roomId),
    enabled: !!roomId && !isJoining,
  })

  useLiveEvent('room.updated', async () => {
    await queryClient.invalidateQueries({ queryKey: ['room', roomId] })
  })

  useEffect(() => {
    if (!socket || !roomId) return

    setIsJoining(true)
    setJoinError(null)

    socket.emit('room.join', { roomId }, (res) => {
      setIsJoining(false)
      if (!res.ok) {
        setJoinError(res.error || 'Failed to join room')
      }
    })

    return () => {
      socket.emit('room.leave', { roomId })
    }
  }, [socket, roomId])

  useEffect(() => {
    if (!joinError && !fetchError) return

    const errorMessage = joinError || (fetchError as Error)?.message
    if (errorMessage) {
      toast.error(errorMessage)
    }

    navigate({ to: '/app/room' }).catch(console.error)
  }, [fetchError, joinError, navigate])

  return {
    room,
    socket,
    error: joinError || (fetchError as Error)?.message,
    isLoading: isRoomLoading || isJoining,
  }
}
