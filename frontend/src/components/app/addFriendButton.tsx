import { Button } from '@/components/ui/button.tsx'
import {
  useGetFriends,
  useGetOutgoingFriendRequests,
  useSendFriendRequest,
  useCancelFriendRequest,
} from '@/api/friends.ts'
import { userStore } from '@/store/userStore.ts'
import { useStore } from '@tanstack/react-store'
import { UserPlusIcon, ClockIcon, BanIcon } from 'lucide-react'

export function AddFriendButton({
  userId,
  blockedByThem = false,
}: {
  userId: string
  blockedByThem?: boolean
}) {
  const currentUserId = useStore(userStore, (state) => state?.id)
  const friendsQuery = useGetFriends()
  const outgoingQuery = useGetOutgoingFriendRequests()
  const sendRequest = useSendFriendRequest()
  const cancelRequest = useCancelFriendRequest()

  if (currentUserId === userId) return null

  if (blockedByThem) {
    return (
      <Button variant="outline" disabled>
        <BanIcon className="size-4" />
        This person doesn&apos;t like you
      </Button>
    )
  }

  const isFriend = friendsQuery.data?.some((f) => f.id === userId) ?? false
  const outgoing = outgoingQuery.data?.find((r) => r.toUser.id === userId)

  if (friendsQuery.isPending || outgoingQuery.isPending) return null
  if (isFriend) return null

  if (outgoing) {
    return (
      <Button
        variant="outline"
        onClick={() => cancelRequest.mutate(outgoing.id)}
        disabled={cancelRequest.isPending}
      >
        <ClockIcon className="size-4" />
        {cancelRequest.isPending ? 'Cancelling…' : 'Request Sent'}
      </Button>
    )
  }

  return (
    <Button
      onClick={() => sendRequest.mutate({ userIdentifier: userId })}
      disabled={sendRequest.isPending}
    >
      <UserPlusIcon className="size-4" />
      {sendRequest.isPending ? 'Sending…' : 'Add Friend'}
    </Button>
  )
}
