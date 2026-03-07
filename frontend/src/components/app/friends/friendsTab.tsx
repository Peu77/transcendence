import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteFriend, getFriends, sendFriendRequest } from '@/api/friends.ts'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { FriendRow } from '@/components/app/friends/friendRow.tsx'
import { DMPanel } from '@/components/app/friends/dmPanel.tsx'
import type { AxiosError } from 'axios'
import { useLiveEvent } from '@/realtime/hooks.ts'

export const FriendsTab = (props: { isOpen: boolean }) => {
  const qc = useQueryClient()

  useLiveEvent(
    'presence.updated',
    (evt) => {
      qc.setQueryData(['friends'], (prev: any) => {
        if (!Array.isArray(prev)) return prev
        return prev.map((f: any) =>
          f.id === evt.userId
            ? {
                ...f,
                presence: {
                  ...(f.presence ?? {}),
                  status: evt.status,
                  lastSeenAt: evt.lastSeenAt,
                  updatedAt: evt.updatedAt,
                },
              }
            : f,
        )
      })
    },
    [props.isOpen],
  )

  useLiveEvent(
    'friendship.deleted',
    async () => {
      await qc.invalidateQueries({ queryKey: ['friends'] })
    },
    [props.isOpen],
  )

  useLiveEvent(
    'friend_request.accepted',
    async () => {
      await qc.invalidateQueries({ queryKey: ['friends'] })
    },
    [props.isOpen],
  )

  const [userIdentifier, setUserIdentifier] = useState('')
  const [activeDmFriendId, setActiveDmFriendId] = useState<string | null>(null)

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

  const deleteFriendMutation = useMutation({
    mutationFn: (friendUserId: string) => deleteFriend(friendUserId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['friends'] })
      toast.success('Friend removed')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? 'Failed to remove friend'),
  })

  const friends = friendsQuery.data ?? []

  const activeDmFriend = useMemo(() => {
    if (!activeDmFriendId) return null
    return friends.find((f) => f.id === activeDmFriendId) ?? null
  }, [activeDmFriendId, friends])

  // If friend list changes (removed etc.), close the DM panel.
  useEffect(() => {
    if (activeDmFriendId && !activeDmFriend) setActiveDmFriendId(null)
  }, [activeDmFriendId, activeDmFriend])

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
            onOpenDM={() => setActiveDmFriendId(friend.id)}
            onDelete={() => deleteFriendMutation.mutate(friend.id)}
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

      {activeDmFriend && (
        <DMPanel
          friend={activeDmFriend}
          onClose={() => setActiveDmFriendId(null)}
        />
      )}
    </div>
  )
}
