import { Button } from '@/components/ui/button.tsx'
import {
  useGetFriends,
  useGetOutgoingFriendRequests,
  useSendFriendRequest,
  useCancelFriendRequest,
  useBlockUser,
  useDeleteFriend,
  useUnblockUser,
} from '@/api/friends.ts'
import { userStore } from '@/store/userStore.ts'
import { useStore } from '@tanstack/react-store'
import {
  UserPlusIcon,
  ClockIcon,
  BanIcon,
  ShieldOffIcon,
  UserMinusIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import type { ComponentProps, ReactNode } from 'react'

function CompactActionButton({
  label,
  icon,
  ...props
}: ComponentProps<typeof Button> & {
  label: string
  icon: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            size="icon-lg"
            aria-label={label}
            className="size-11 border-border/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            {...props}
          >
            {icon}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function AddFriendButton({
  userId,
  blockedByThem = false,
  iBlockedThem = false,
  compact = false,
}: {
  userId: string
  blockedByThem?: boolean
  iBlockedThem?: boolean
  compact?: boolean
}) {
  const currentUserId = useStore(userStore, (state) => state?.id)
  const friendsQuery = useGetFriends()
  const outgoingQuery = useGetOutgoingFriendRequests()
  const sendRequest = useSendFriendRequest()
  const cancelRequest = useCancelFriendRequest()
  const block = useBlockUser()
  const deleteFriend = useDeleteFriend()
  const unblock = useUnblockUser()

  if (currentUserId === userId) return null

  if (iBlockedThem) {
    const label = unblock.isPending ? 'Unblocking…' : 'Unblock user'

    if (compact) {
      return (
        <CompactActionButton
          label={label}
          icon={<ShieldOffIcon className="size-5" />}
          variant="outline"
          onClick={() =>
            unblock.mutate(userId, {
              onSuccess: () => toast.success('User unblocked'),
              onError: () => toast.error('Failed to unblock'),
            })
          }
          disabled={unblock.isPending}
        />
      )
    }

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
    if (compact) {
      return (
        <CompactActionButton
          label="This user has blocked you"
          icon={<BanIcon className="size-5" />}
          variant="outline"
          disabled
        />
      )
    }

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
  if (isFriend) {
    if (compact) {
      return (
        <>
          <CompactActionButton
            label={deleteFriend.isPending ? 'Removing…' : 'Remove friend'}
            icon={<UserMinusIcon className="size-5" />}
            variant="outline"
            onClick={() =>
              deleteFriend.mutate(userId, {
                onSuccess: () => toast.success('Friend removed'),
                onError: () => toast.error('Failed to remove friend'),
              })
            }
            disabled={deleteFriend.isPending || block.isPending}
          />
          <CompactActionButton
            label={block.isPending ? 'Blocking…' : 'Block user'}
            icon={<BanIcon className="size-5" />}
            variant="destructive"
            onClick={() =>
              block.mutate(userId, {
                onSuccess: () => toast.success('User blocked'),
                onError: () => toast.error('Failed to block user'),
              })
            }
            disabled={deleteFriend.isPending || block.isPending}
          />
        </>
      )
    }

    return (
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          onClick={() =>
            deleteFriend.mutate(userId, {
              onSuccess: () => toast.success('Friend removed'),
              onError: () => toast.error('Failed to remove friend'),
            })
          }
          disabled={deleteFriend.isPending || block.isPending}
        >
          <UserMinusIcon className="mr-2 size-4" />
          {deleteFriend.isPending ? 'Removing…' : 'Remove Friend'}
        </Button>
        <Button
          variant="destructive"
          onClick={() =>
            block.mutate(userId, {
              onSuccess: () => toast.success('User blocked'),
              onError: () => toast.error('Failed to block user'),
            })
          }
          disabled={deleteFriend.isPending || block.isPending}
        >
          <BanIcon className="mr-2 size-4" />
          {block.isPending ? 'Blocking…' : 'Block'}
        </Button>
      </div>
    )
  }

  if (outgoing) {
    if (compact) {
      return (
        <CompactActionButton
          label={
            cancelRequest.isPending ? 'Cancelling…' : 'Cancel friend request'
          }
          icon={<ClockIcon className="size-5" />}
          variant="outline"
          onClick={() => cancelRequest.mutate(outgoing.id)}
          disabled={cancelRequest.isPending}
        />
      )
    }

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

  if (compact) {
    return (
      <CompactActionButton
        label={sendRequest.isPending ? 'Sending…' : 'Add friend'}
        icon={<UserPlusIcon className="size-5" />}
        onClick={() => sendRequest.mutate({ userIdentifier: userId })}
        disabled={sendRequest.isPending}
      />
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
