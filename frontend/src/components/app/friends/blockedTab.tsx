import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getBlockedUsers, unblockUser, type BlockedUser } from '@/api/friends.ts'
import { Button } from '@/components/ui/button.tsx'
import { RequestRow } from '@/components/app/friends/requestRow.tsx'

export const BlockedTab = (props: { isOpen: boolean }) => {
  const qc = useQueryClient()

  const blockedQuery = useQuery({
    queryKey: ['friends', 'blocked'],
    queryFn: getBlockedUsers,
    enabled: props.isOpen,
    refetchOnWindowFocus: false,
  })

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['friends', 'blocked'] })
      toast.success('User unblocked')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? 'Failed to unblock user'),
  })

  const blocked = blockedQuery.data ?? []

  const content = (() => {
    if (blockedQuery.isLoading)
      return (
        <div className="mt-2 text-muted-foreground text-sm">Loading…</div>
      )
    if (blocked.length === 0)
      return (
        <div className="mt-2 text-muted-foreground text-sm">
          No blocked users.
        </div>
      )
    return (
      <div className="mt-2">
        {blocked.map((user: BlockedUser) => (
          <RequestRow
            key={user.id}
            label="blocked"
            user={user}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => unblockMutation.mutate(user.id)}
                disabled={unblockMutation.isPending}
              >
                Unblock
              </Button>
            }
          />
        ))}
      </div>
    )
  })()

  return (
    <div className="p-4">
      <div className="text-sm font-semibold">Blocked users</div>
      {content}
    </div>
  )
}
