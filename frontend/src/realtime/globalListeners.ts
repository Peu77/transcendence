import { useLiveEvent } from '@/realtime/hooks.ts'
import { toast } from 'sonner'
import { userStore } from '@/store/userStore.ts'

export function useGlobalListeners() {
  useLiveEvent('dm.created', (event) => {
    if (event.senderId === userStore.state?.id) return

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
