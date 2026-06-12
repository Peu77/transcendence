import { useEffect } from 'react'
import { useLiveEvent } from '@/realtime/hooks.ts'
import { useNavigate } from '@tanstack/react-router'
import { FRIENDS_QUERY_KEYS } from '@/api/friends.ts'
import { USER_QUERY_KEYS } from '@/api/user.ts'
import {
  checkAndQueueNewAchievements,
  gameActiveState,
  initAchievementBaseline,
} from '@/store/achievementNotificationStore.ts'
import { toast } from 'sonner'
import { userStore } from '@/store/userStore.ts'
import {
  friendsOverlayStore,
  setFriendsOverlayIsOpen,
} from '@/store/friendsOverlayStore.tsx'
import { useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'

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
  const navigate = useNavigate()
  const qc = useQueryClient()
  const overlayState = useStore(friendsOverlayStore)

  useEffect(() => {
    initAchievementBaseline(qc)
  }, [qc])

  useLiveEvent('dm.created', (event) => {
    if (event.senderId === userStore.state?.id) return

    void qc.invalidateQueries({
      queryKey: FRIENDS_QUERY_KEYS.UNREAD_MESSAGES,
    })

    if (
      overlayState.isOpen &&
      overlayState.activeDmFriendId === event.senderId
    ) {
      return
    }

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
    await Promise.all([
      qc.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.FRIENDS }),
      qc.invalidateQueries({
        queryKey: FRIENDS_QUERY_KEYS.UNREAD_MESSAGES,
      }),
    ])
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
