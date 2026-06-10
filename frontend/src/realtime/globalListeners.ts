import { useLiveEvent } from '@/realtime/hooks.ts'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { userStore } from '@/store/userStore.ts'
import { setFriendsOverlayIsOpen } from '@/store/friendsOverlayStore.tsx'

export function useGlobalListeners() {
  const navigate = useNavigate()

  useLiveEvent('dm.created', (event) => {
    if (event.senderId === userStore.state?.id) return

    if (event.type === 'match_invite' && event.roomId) {
      const roomId = event.roomId
      toast.info('Match invite', {
        description: `${event.senderInfo.username} invited you to a match`,
        action: {
          label: 'Join',
          onClick: () => {
            setFriendsOverlayIsOpen(false)
            void navigate({ to: '/app/room/$roomId', params: { roomId } })
          },
        },
      })
      return
    }

    toast.info('New direct message received', {
      description: `Message from user ${event.senderInfo.username}: "${event.content}"`,
    })
  })

  useLiveEvent('friend_request.created', (event) => {
    toast.info('New friend request', {
      description: `You have a new friend request from ${event.senderInfo.username}`,
    })
  })
}
