import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  acceptFriendRequest,
  cancelFriendRequest,
  denyFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  type IncomingFriendRequest,
  type OutgoingFriendRequest,
} from '@/api/friends.ts'
import { RequestRow } from '@/components/app/friends/requestRow.tsx'
import { Button } from '@/components/ui/button.tsx'
import { useLiveEvent } from '@/realtime/hooks.ts'

export const RequestsTab = (props: { isOpen: boolean }) => {
  const qc = useQueryClient()

  useLiveEvent(
    'friend_request.created',
    async () => {
      await qc.invalidateQueries({
        queryKey: ['friends', 'requests', 'incoming'],
      })
    },
    [props.isOpen],
  )

  useLiveEvent(
    'friend_request.canceled',
    async () => {
      await qc.invalidateQueries({
        queryKey: ['friends', 'requests', 'incoming'],
      })
      await qc.invalidateQueries({
        queryKey: ['friends', 'requests', 'outgoing'],
      })
    },
    [props.isOpen],
  )

  useLiveEvent(
    'friend_request.denied',
    async () => {
      await qc.invalidateQueries({
        queryKey: ['friends', 'requests', 'incoming'],
      })
      await qc.invalidateQueries({
        queryKey: ['friends', 'requests', 'outgoing'],
      })
    },
    [props.isOpen],
  )

  useLiveEvent(
    'friend_request.accepted',
    async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['friends'] }),
        qc.invalidateQueries({ queryKey: ['friends', 'requests', 'incoming'] }),
        qc.invalidateQueries({ queryKey: ['friends', 'requests', 'outgoing'] }),
      ])
    },
    [props.isOpen],
  )

  const incomingQuery = useQuery({
    queryKey: ['friends', 'requests', 'incoming'],
    queryFn: getIncomingFriendRequests,
    enabled: props.isOpen,
    refetchOnWindowFocus: false,
  })

  const outgoingQuery = useQuery({
    queryKey: ['friends', 'requests', 'outgoing'],
    queryFn: getOutgoingFriendRequests,
    enabled: props.isOpen,
    refetchOnWindowFocus: false,
  })

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => acceptFriendRequest(requestId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['friends'] }),
        qc.invalidateQueries({ queryKey: ['friends', 'requests', 'incoming'] }),
      ])
      toast.success('Friend request accepted')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? 'Failed to accept request'),
  })

  const denyMutation = useMutation({
    mutationFn: (requestId: string) => denyFriendRequest(requestId),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ['friends', 'requests', 'incoming'],
      })
      toast.success('Friend request denied')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? 'Failed to deny request'),
  })

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => cancelFriendRequest(requestId),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ['friends', 'requests', 'outgoing'],
      })
      toast.success('Request cancelled')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? 'Failed to cancel request'),
  })

  const incoming = incomingQuery.data ?? []
  const outgoing = outgoingQuery.data ?? []

  const incomingContent = (() => {
    if (incomingQuery.isLoading)
      return <div className="mt-2 text-muted-foreground text-sm">Loading…</div>
    if (incoming.length === 0)
      return (
        <div className="mt-2 text-muted-foreground text-sm">
          No incoming requests.
        </div>
      )
    return (
      <div className="mt-2">
        {incoming.map((r: IncomingFriendRequest) => (
          <RequestRow
            key={r.id}
            label="wants to be your friend"
            user={r.fromUser}
            actions={
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => acceptMutation.mutate(r.id)}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => denyMutation.mutate(r.id)}
                >
                  Deny
                </Button>
              </>
            }
          />
        ))}
      </div>
    )
  })()

  const outgoingContent = (() => {
    if (outgoingQuery.isLoading)
      return <div className="mt-2 text-muted-foreground text-sm">Loading…</div>
    if (outgoing.length === 0)
      return (
        <div className="mt-2 text-muted-foreground text-sm">
          No outgoing requests.
        </div>
      )
    return (
      <div className="mt-2">
        {outgoing.map((r: OutgoingFriendRequest) => (
          <RequestRow
            key={r.id}
            label="pending"
            user={r.toUser}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => cancelMutation.mutate(r.id)}
              >
                Cancel
              </Button>
            }
          />
        ))}
      </div>
    )
  })()

  return (
    <div className="p-4">
      <div className="text-sm font-semibold">Incoming</div>
      {incomingContent}

      <div className="mt-6 text-sm font-semibold">Outgoing</div>
      {outgoingContent}
    </div>
  )
}
