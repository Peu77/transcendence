import { Button } from '@/components/ui/button.tsx'
import {
  useGetFriends,
  useGetOutgoingFriendRequests,
  useSendFriendRequest,
  useCancelFriendRequest,
  useUnblockUser,
} from '@/api/friends.ts'
import { userStore } from '@/store/userStore.ts'
import { useStore } from '@tanstack/react-store'
import { UserPlusIcon, ClockIcon, BanIcon, ShieldOffIcon } from 'lucide-react'
import { toast } from 'sonner'

export function AddFriendButton({
  userId,
  blockedByThem = false,
  iBlockedThem = false,
}: {
  userId: string
  blockedByThem?: boolean
  iBlockedThem?: boolean
}) {
  const currentUserId = useStore(userStore, (state) => state?.id)
  const friendsQuery = useGetFriends()
  const outgoingQuery = useGetOutgoingFriendRequests()
  const sendRequest = useSendFriendRequest()
  const cancelRequest = useCancelFriendRequest()
  const unblock = useUnblockUser()

  if (currentUserId === userId) return null

  if (iBlockedThem) {
    return (
      <Button
        variant="outline"
        onClick={() =>
          unblock.mutate(userId, {
            onSuccess: () => toast.success('User unblocked'),
            onError: () => toast.error('Failed to unblock'),
          })
        }
        disabled={unblock.isPending}
      >
        <ShieldOffIcon className="size-4 mr-2" />
        {unblock.isPending ? 'Unblocking…' : 'Unblock'}
      </Button>
    )
  }

  if (blockedByThem) {
    return (
      <Button variant="outline" disabled>
        <BanIcon className="size-4 mr-2" />
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
        <ClockIcon className="size-4 mr-2" />
        {cancelRequest.isPending ? 'Cancelling…' : 'Request Sent'}
      </Button>
    )
  }

  return (
    <Button
      onClick={() => sendRequest.mutate({ userIdentifier: userId })}
      disabled={sendRequest.isPending}
    >
      <UserPlusIcon className="size-4 mr-2" />
      {sendRequest.isPending ? 'Sending…' : 'Add Friend'}
    </Button>
  )
}
