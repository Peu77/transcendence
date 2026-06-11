import { useLiveEvent } from '@/realtime/hooks.ts'
import { FRIENDS_QUERY_KEYS } from '@/api/friends.ts'
import { USER_QUERY_KEYS } from '@/api/user.ts'
import {
  type AchievementsResponse,
  getAchievements,
} from '@/api/achievements.ts'
import { queueAchievementNotifications } from '@/store/achievementNotificationStore.ts'
import { toast } from 'sonner'
import { userStore } from '@/store/userStore.ts'
import { useQueryClient } from '@tanstack/react-query'

let globalReceiveSound: HTMLAudioElement | null = null
function getGlobalReceiveSound() {
  if (!globalReceiveSound)
    globalReceiveSound = new Audio('/sounds/message_receive.mp3')
  return globalReceiveSound
}

let friendRequestSound: HTMLAudioElement | null = null
function getFriendRequestSound() {
  if (!friendRequestSound)
    friendRequestSound = new Audio('/sounds/friend_request.mp3')
  return friendRequestSound
}

export function useGlobalListeners() {
  const qc = useQueryClient()

  useLiveEvent('dm.created', (event) => {
    if (event.senderId === userStore.state?.id) return

    const sound = getGlobalReceiveSound()
    sound.currentTime = 0
    sound.play().catch(() => {})

    toast.info('New direct message received', {
      description: `Message from user ${event.senderInfo.username}: "${event.content}"`,
    })
  })

  useLiveEvent('friend_request.created', (event) => {
    const sound = getFriendRequestSound()
    sound.currentTime = 0
    sound.play().catch(() => {})

    toast.info('New friend request', {
      description: `You have a new friend request from ${event.senderInfo.username}`,
    })
  })

  // Keep AddFriendButton in sync when the other person accepts or denies your request
  useLiveEvent('friend_request.accepted', async () => {
    await qc.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.FRIENDS })
    await qc.invalidateQueries({
      queryKey: FRIENDS_QUERY_KEYS.OUTGOING_REQUESTS,
    })
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

  // Detect newly unlocked achievements after a multiplayer match ends
  useLiveEvent('game.finished', async () => {
    const prev = qc.getQueryData<AchievementsResponse>(['achievements'])
    const prevUnlocked = new Set(
      prev?.achievements.filter((a) => a.unlocked).map((a) => a.id) ?? [],
    )

    const next = await qc.fetchQuery({
      queryKey: ['achievements'],
      queryFn: getAchievements,
      staleTime: 0,
    })

    const newly = next.achievements.filter(
      (a) => a.unlocked && !prevUnlocked.has(a.id),
    )
    if (newly.length > 0) {
      queueAchievementNotifications(newly)
    }
  })
}
