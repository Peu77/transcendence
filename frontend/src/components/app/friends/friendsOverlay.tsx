import { useState } from 'react'
import { useStore } from '@tanstack/react-store'
import {
  friendsOverlayStore,
  setFriendsOverlayIsOpen,
} from '@/store/friendsOverlayStore.tsx'
import { useEffect } from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import { FriendsTab } from '@/components/app/friends/friendsTab.tsx'
import { RequestsTab } from '@/components/app/friends/requestsTab.tsx'
import { BlockedTab } from '@/components/app/friends/blockedTab.tsx'
import { DMPanel } from '@/components/app/friends/dmPanel.tsx'
import type { Friend } from '@/api/friends.ts'

export const FriendsOverlay = () => {
  const isOpen = useStore(friendsOverlayStore, (s) => s.isOpen)
  const [activeDmFriend, setActiveDmFriend] = useState<Friend | null>(null)

  useEffect(() => {
    const cancelSignal = new AbortController()

    globalThis.addEventListener(
      'keydown',
      (e) => {
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
  }, [isOpen])

  return (
    <>
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
        className={`fixed z-50 top-1/2 -translate-y-1/2 flex bg-sidebar border-r border-sidebar-border shadow-2xl transition-all duration-300 ease-in-out clip-pixel-corners-btn ${
          isOpen
            ? `translate-x-0 left-5 h-[calc(100dvh-2rem)] ${activeDmFriend ? 'w-[760px]' : 'w-[380px]'}`
            : 'left-0 h-[calc(100dvh/2)] -translate-x-full w-[380px]'
        }`}
      >
        <div className="w-[380px] shrink-0 flex flex-col overflow-y-auto">
          <h2 className="p-4 font-bold text-lg border-b border-sidebar-border shrink-0">
            Friends
          </h2>

          <Tabs className="w-full mt-2" defaultValue={'friends'}>
            <TabsList className="flex w-full">
              <TabsTrigger className="w-full" value={'friends'}>
                Friends
              </TabsTrigger>
              <TabsTrigger className="w-full" value={'requests'}>
                Requests
              </TabsTrigger>
              <TabsTrigger className="w-full" value={'blocked'}>
                Blocked
              </TabsTrigger>
            </TabsList>

            <TabsContent value={'friends'}>
              <FriendsTab
                isOpen={isOpen}
                activeDmFriend={activeDmFriend}
                onOpenDM={setActiveDmFriend}
                onCloseDM={() => setActiveDmFriend(null)}
              />
            </TabsContent>

            <TabsContent value={'requests'}>
              <RequestsTab isOpen={isOpen} />
            </TabsContent>

            <TabsContent value={'blocked'}>
              <BlockedTab isOpen={isOpen} />
            </TabsContent>
          </Tabs>
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
