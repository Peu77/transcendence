import { useMutation } from '@tanstack/react-query'
import { useMatchRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { type DirectMessage, sendMatchInvite } from '@/api/friends.ts'

type UseMatchInviteOptions = {
  onSuccess?: (message: DirectMessage) => void | Promise<void>
}

export function useMatchInvite(
  friendUserId: string,
  options: UseMatchInviteOptions = {},
) {
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const roomMatch = matchRoute({ to: '/app/room/$roomId' })
  const currentRoomId = roomMatch ? roomMatch.roomId : undefined

  return useMutation({
    mutationFn: () => sendMatchInvite(friendUserId, currentRoomId),
    onSuccess: async (message) => {
      if (!message.roomId) return

      await options.onSuccess?.(message)
      await navigate({
        to: '/app/room/$roomId',
        params: { roomId: message.roomId },
      })
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? 'Failed to send match invite',
      )
    },
  })
}
