import { useStore } from '@tanstack/react-store'
import {
  friendsOverlayStore,
  setFriendsOverlayIsOpen,
} from '@/store/friendsOverlayStore.tsx'
import { useEffect, useState } from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import { FriendsTab } from '@/components/app/friends/friendsTab.tsx'
import { RequestsTab } from '@/components/app/friends/requestsTab.tsx'
import {
  type Friend,
  useGetBlockedUsers,
  useUnblockUser,
} from '@/api/friends.ts'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { Button } from '@/components/ui/button.tsx'
import { ChevronUpIcon } from 'lucide-react'
import { toast } from 'sonner'
import { DMPanel } from '@/components/app/friends/dmPanel.tsx'
import { ProfileDialog } from '@/components/app/profileDialog.tsx'

function BlockedDrawer() {
  const [expanded, setExpanded] = useState(false)
  const { data: blocked = [], isLoading } = useGetBlockedUsers()
  const unblockMutation = useUnblockUser()

  return (
    <div className="border-t border-sidebar-border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>Blocked{blocked.length > 0 ? ` (${blocked.length})` : ''}</span>
        <ChevronUpIcon
          className={`size-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? '18rem' : '0px' }}
      >
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto px-3 pb-3">
          {isLoading && (
            <p className="px-1 py-2 text-xs text-muted-foreground">Loading…</p>
          )}
          {!isLoading && blocked.length === 0 && (
            <p className="px-1 py-2 text-xs text-muted-foreground">
              No blocked users.
            </p>
          )}
          {blocked.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-md px-2 py-2"
            >
              <ProfileImage
                profilePictureId={user.profilePictureId}
                className="size-8 shrink-0"
              />
              <span className="flex-1 truncate text-sm font-medium">
                {user.username}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-xs"
                disabled={unblockMutation.isPending}
                onClick={() =>
                  unblockMutation.mutate(user.id, {
                    onSuccess: () =>
                      toast.success(`Unblocked ${user.username}`),
                    onError: () => toast.error('Failed to unblock'),
                  })
                }
              >
                Unblock
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const FriendsOverlay = () => {
  const isOpen = useStore(friendsOverlayStore, (s) => s.isOpen)
  const [activeDmFriend, setActiveDmFriend] = useState<Friend | null>(null)
  const [profileFriend, setProfileFriend] = useState<Friend | null>(null)

  useEffect(() => {
    const cancelSignal = new AbortController()

    globalThis.addEventListener(
      'keydown',
      (e) => {
        if (profileFriend) return

        if (e.key === 'Escape' && isOpen) {
          e.preventDefault()
          setFriendsOverlayIsOpen(false)
        }

        if (e.key === 'Tab') {
          e.preventDefault()
          e.stopPropagation()
          setFriendsOverlayIsOpen(!isOpen)
        }
      },
      { signal: cancelSignal.signal },
    )

    return () => {
      cancelSignal.abort()
    }
  }, [isOpen, profileFriend])

  return (
    <>
      <ProfileDialog
        userId={profileFriend?.id ?? ''}
        open={profileFriend !== null}
        onOpenChange={(open) => {
          if (!open) setProfileFriend(null)
        }}
      />
      <button
        type="button"
        aria-label="Close friends overlay"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        tabIndex={isOpen ? 0 : -1}
        onClick={() => setFriendsOverlayIsOpen(false)}
      />
      <div
        className={`fixed top-1/2 z-50 flex -translate-y-1/2 border-r border-sidebar-border bg-sidebar shadow-2xl transition-all duration-300 ease-in-out clip-pixel-corners-btn ${
          isOpen
            ? `left-5 h-[calc(100dvh-2rem)] translate-x-0 ${
                activeDmFriend ? 'w-[calc(100vw-2.5rem)] max-w-280' : 'w-95'
              }`
            : activeDmFriend
              ? 'left-0 h-[calc(100dvh-2rem)] w-[calc(100vw-2.5rem)] max-w-280 -translate-x-full'
              : 'left-0 h-[calc(100dvh/2)] w-95 -translate-x-full'
        }`}
      >
        <div className="flex w-95 shrink-0 flex-col overflow-hidden">
          <h2 className="p-4 font-bold text-lg border-b border-sidebar-border shrink-0">
            Friends
          </h2>

          <Tabs
            className="mt-2 flex min-h-0 w-full flex-1 flex-col"
            defaultValue="friends"
          >
            <TabsList className="flex w-full">
              <TabsTrigger className="w-full" value="friends">
                Friends
              </TabsTrigger>
              <TabsTrigger className="w-full" value="requests">
                Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent
              className="min-h-0 flex-1 overflow-y-auto"
              value="friends"
            >
              <FriendsTab
                isOpen={isOpen}
                activeDmFriend={activeDmFriend}
                onOpenDM={setActiveDmFriend}
                onOpenProfile={setProfileFriend}
                onCloseDM={() => setActiveDmFriend(null)}
              />
            </TabsContent>

            <TabsContent
              className="min-h-0 flex-1 overflow-y-auto"
              value="requests"
            >
              <RequestsTab isOpen={isOpen} />
            </TabsContent>
          </Tabs>

          <BlockedDrawer />
        </div>

        {activeDmFriend && (
          <div className="flex-1 border-l border-sidebar-border overflow-hidden flex flex-col min-w-0">
            <DMPanel
              friend={activeDmFriend}
              onClose={() => setActiveDmFriend(null)}
            />
          </div>
        )}
      </div>
    </>
  )
}
