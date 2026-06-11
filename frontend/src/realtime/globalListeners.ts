import { useLiveEvent } from '@/realtime/hooks.ts'
import { FRIENDS_QUERY_KEYS } from '@/api/friends.ts'
import { USER_QUERY_KEYS } from '@/api/user.ts'
import { checkAndQueueNewAchievements, gameActiveState } from '@/store/achievementNotificationStore.ts'
import { toast } from 'sonner'
import { userStore } from '@/store/userStore.ts'
import { useQueryClient } from '@tanstack/react-query'

export function useGlobalListeners() {
  const qc = useQueryClient()

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

  // Keep AddFriendButton in sync when the other person accepts your request, and
  // check for newly unlocked social/collection achievements
  useLiveEvent('friend_request.accepted', async () => {
    await qc.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.FRIENDS })
    await qc.invalidateQueries({
      queryKey: FRIENDS_QUERY_KEYS.OUTGOING_REQUESTS,
    })
    await checkAndQueueNewAchievements(qc)
  })

  useLiveEvent('friend_request.denied', async () => {
    await qc.invalidateQueries({
      queryKey: FRIENDS_QUERY_KEYS.OUTGOING_REQUESTS,
    })
  })

  useLiveEvent('friendship.deleted', async () => {
    await qc.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.FRIENDS })
  })

  // When someone blocks you, their profile's blockedByThem flag needs to update
  useLiveEvent('user.blocked', async (event) => {
    await qc.invalidateQueries({
      queryKey: USER_QUERY_KEYS.PUBLIC_PROFILE(event.blockerId),
    })
  })

  // Keep the multiplayer room list in sync
  useLiveEvent('rooms.updated', async () => {
    await qc.invalidateQueries({ queryKey: ['rooms'] })
  })

  // Track game lifecycle so achievement popups are suppressed during play
  useLiveEvent('game.countdown', () => {
    gameActiveState.set(true)
  })

  useLiveEvent('game.finished', async () => {
    gameActiveState.set(false)
    await checkAndQueueNewAchievements(qc)
  })
}
