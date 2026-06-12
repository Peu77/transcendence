import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getFriends, sendFriendRequest, type Friend } from '@/api/friends.ts'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { FriendRow } from '@/components/app/friends/friendRow.tsx'
import type { AxiosError } from 'axios'
import { useLiveEvent } from '@/realtime/hooks.ts'

export const FriendsTab = (props: {
  isOpen: boolean
  activeDmFriend: Friend | null
  onOpenDM: (friend: Friend) => void
  onOpenProfile: (friend: Friend) => void
  onCloseDM: () => void
}) => {
  const qc = useQueryClient()

  const handlePresenceUpdated = useCallback(
    (evt: {
      userId: string
      status: string
      lastSeenAt: string | null
      updatedAt: string
    }) => {
      qc.setQueryData(['friends'], (prev: any) => {
        if (!Array.isArray(prev)) return prev
        return prev.map((f: any) =>
          f.id === evt.userId
            ? {
                ...f,
                presence: {
                  ...(f.presence || undefined),
                  status: evt.status,
                  lastSeenAt: evt.lastSeenAt,
                  updatedAt: evt.updatedAt,
                },
              }
            : f,
        )
      })
    },
    [qc],
  )

  const invalidateFriends = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['friends'] })
  }, [qc])

  useLiveEvent('presence.updated', handlePresenceUpdated)
  useLiveEvent('friendship.deleted', invalidateFriends)
  useLiveEvent('friend_request.accepted', invalidateFriends)

  const { activeDmFriend, onOpenDM, onCloseDM } = props

  const [userIdentifier, setUserIdentifier] = useState('')

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
    enabled: props.isOpen,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  })

  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      const trimmed = userIdentifier.trim()
      if (!trimmed) throw new Error('Missing user id or username')
      return sendFriendRequest({ userIdentifier: trimmed })
    },
    onSuccess: async () => {
      setUserIdentifier('')
      await qc.invalidateQueries({
        queryKey: ['friends', 'requests', 'outgoing'],
      })
      toast.success('Friend request sent')
    },
    onError: (
      e: AxiosError<{
        message: string
      }>,
    ) => {
      if (e.response?.status === 422) {
        toast.error('Invalid user id or username')
        return
      }

      toast.error(e?.response?.data?.message ?? 'Failed to send friend request')
    },
  })

  const friends = useMemo(() => friendsQuery.data ?? [], [friendsQuery.data])

  // If the active DM friend is removed from the list, close the panel.
  useEffect(() => {
    if (
      activeDmFriend &&
      !friendsQuery.isLoading &&
      !friends.find((f) => f.id === activeDmFriend.id)
    ) {
      onCloseDM()
    }
  }, [friends, friendsQuery.isLoading, activeDmFriend, onCloseDM])

  const friendsContent = (() => {
    if (friendsQuery.isLoading) {
      return (
        <div className="mt-4 text-muted-foreground text-sm">
          Loading friends…
        </div>
      )
    }
    if (friends.length === 0) {
      return (
        <div className="mt-4 text-muted-foreground text-sm">
          No friends yet.
        </div>
      )
    }
    return (
      <div className="mt-4">
        {friends.map((friend) => (
          <FriendRow
            key={friend.id}
            friend={friend}
            onOpenDM={() => onOpenDM(friend)}
            onOpenProfile={() => props.onOpenProfile(friend)}
          />
        ))}
      </div>
    )
  })()

  return (
    <div className="p-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          sendRequestMutation.mutate()
        }}
      >
        <Input
          value={userIdentifier}
          onChange={(e) => setUserIdentifier(e.target.value)}
          placeholder="Add friend by user id or username"
        />
        <Button type="submit" disabled={sendRequestMutation.isPending}>
          Add
        </Button>
      </form>

      {friendsContent}
    </div>
  )
}
