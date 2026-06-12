import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  type DirectMessage,
  type Friend,
  getDirectMessages,
  sendDirectMessage,
} from '@/api/friends.ts'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { useDmRoom, useLiveEvent } from '@/realtime/hooks.ts'
import { userStore } from '@/store/userStore.ts'
import { useNavigate } from '@tanstack/react-router'
import { Gamepad2Icon } from 'lucide-react'
import { useMatchInvite } from '@/hooks/use-match-invite.ts'

let dmSendSound: HTMLAudioElement | null = null
let dmReceiveSound: HTMLAudioElement | null = null
function getDmSendSound() {
  if (!dmSendSound) dmSendSound = new Audio('/sounds/message_send.mp3')
  return dmSendSound
}
function getDmReceiveSound() {
  if (!dmReceiveSound) dmReceiveSound = new Audio('/sounds/message_receive.mp3')
  return dmReceiveSound
}
import { setFriendsOverlayIsOpen } from '@/store/friendsOverlayStore.tsx'

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const result: T[] = []
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    result.push(item)
  }
  return result
}

export const DMPanel = (props: {
  friend: Friend
  onClose: () => void
  onOpenProfile: () => void
}) => {
  const qc = useQueryClient()
  const navigate = useNavigate()

  useDmRoom(props.friend.id)

  const goToRoom = useCallback(
    async (roomId: string) => {
      setFriendsOverlayIsOpen(false)
      await navigate({ to: '/app/room/$roomId', params: { roomId } })
    },
    [navigate],
  )

  const [input, setInput] = useState('')
  const [oldestCursor, setOldestCursor] = useState<string | null>(null)
  const [newestCursor, setNewestCursor] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const pendingOlderRef = useRef(false)
  const prevScrollHeightRef = useRef(0)
  const prevScrollTopRef = useRef(0)
  const stickToBottomRef = useRef(true)
  const didInitialScrollRef = useRef(false)
  const sendingRef = useRef(false)
  const loadingOlderRef = useRef(false)
  const loadingNewerRef = useRef(false)

  const queryKey = useMemo(() => ['dm', props.friend.id], [props.friend.id])

  const dmQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await getDirectMessages(props.friend.id, { limit: 25 })
      setOldestCursor(data.pageInfo.oldestCursor)
      setNewestCursor(data.pageInfo.newestCursor)
      return data
    },
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  })

  const loadOlderMutation = useMutation({
    mutationFn: async () => {
      if (!oldestCursor) return null
      return getDirectMessages(props.friend.id, {
        limit: 25,
        before: oldestCursor,
      })
    },
    onSuccess: (data) => {
      if (!data) return
      setOldestCursor(data.pageInfo.oldestCursor)
      qc.setQueryData(queryKey, (prev: any) => {
        if (!prev) return data
        return {
          ...prev,
          messages: dedupeById([...data.messages, ...(prev.messages ?? [])]),
          pageInfo: {
            ...prev.pageInfo,
            ...data.pageInfo,
            newestCursor:
              prev.pageInfo?.newestCursor ?? data.pageInfo.newestCursor,
          },
        }
      })
    },
    onSettled: () => {
      loadingOlderRef.current = false
    },
  })

  const loadNewerMutation = useMutation({
    mutationFn: async () => {
      if (!newestCursor) return null
      return getDirectMessages(props.friend.id, {
        limit: 25,
        after: newestCursor,
      })
    },
    onSuccess: (data) => {
      if (!data) return
      setNewestCursor(data.pageInfo.newestCursor)
      qc.setQueryData(queryKey, (prev: any) => {
        if (!prev) return data
        return {
          ...prev,
          messages: dedupeById([...(prev.messages ?? []), ...data.messages]),
          pageInfo: {
            ...prev.pageInfo,
            ...data.pageInfo,
            oldestCursor:
              prev.pageInfo?.oldestCursor ?? data.pageInfo.oldestCursor,
          },
        }
      })
    },
    onSettled: () => {
      loadingNewerRef.current = false
    },
  })

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceToBottom < 80

    if (
      el.scrollTop < 80 &&
      dmQuery.data?.pageInfo?.hasOlder &&
      !loadingOlderRef.current
    ) {
      loadingOlderRef.current = true
      pendingOlderRef.current = true
      prevScrollHeightRef.current = el.scrollHeight
      prevScrollTopRef.current = el.scrollTop
      loadOlderMutation.mutate()
    }

    if (
      distanceToBottom < 80 &&
      dmQuery.data?.pageInfo?.hasNewer &&
      !loadingNewerRef.current
    ) {
      loadingNewerRef.current = true
      loadNewerMutation.mutate()
    }
  }, [
    dmQuery.data?.pageInfo?.hasOlder,
    dmQuery.data?.pageInfo?.hasNewer,
    loadOlderMutation,
    loadNewerMutation,
  ])

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      sendDirectMessage(props.friend.id, { content }),
    onSuccess: async () => {
      setInput('')
      const sound = getDmSendSound()
      sound.currentTime = 0
      sound.play().catch(() => {})
      await qc.invalidateQueries({ queryKey })
    },
    onError: (e: any) => {
      if (e?.response?.status === 403) {
        toast.error('You cannot send messages to this user')
        return
      }
      toast.error(e?.response?.data?.message ?? 'Failed to send message')
    },
    onSettled: () => {
      sendingRef.current = false
    },
  })

  const handleSend = useCallback(() => {
    if (sendingRef.current) return
    const content = input.trim()
    if (!content) return
    sendingRef.current = true
    sendMutation.mutate(content)
  }, [input, sendMutation])

  const inviteMutation = useMatchInvite(props.friend.id, {
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey })
    },
  })

  const messages = useMemo(
    () => dmQuery.data?.messages ?? [],
    [dmQuery.data?.messages],
  )

  useEffect(() => {
    didInitialScrollRef.current = false
    stickToBottomRef.current = true
    pendingOlderRef.current = false
  }, [props.friend.id])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return

    if (pendingOlderRef.current) {
      el.scrollTop =
        prevScrollTopRef.current +
        (el.scrollHeight - prevScrollHeightRef.current)
      pendingOlderRef.current = false
      return
    }

    if (!didInitialScrollRef.current && messages.length > 0) {
      el.scrollTop = el.scrollHeight
      didInitialScrollRef.current = true
      return
    }

    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  const messagesContent = (() => {
    if (dmQuery.isLoading)
      return <div className="text-muted-foreground">Loading…</div>
    if (messages.length === 0)
      return <div className="text-muted-foreground">No messages yet.</div>
    return (
      <div className="flex flex-col gap-2">
        {loadOlderMutation.isPending && (
          <div className="text-center text-xs text-muted-foreground">
            Loading older messages…
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col">
            <div className="text-xs text-muted-foreground">
              {new Date(m.createdAt).toLocaleString()}
            </div>
            {m.type === 'match_invite' ? (
              <div className="flex flex-col gap-2 rounded-md border border-sidebar-border/70 bg-background/40 p-2">
                <div className="wrap-break-word font-medium">{m.content}</div>
                {m.senderId === props.friend.id ? (
                  <Button
                    size="sm"
                    disabled={!m.roomId}
                    onClick={() => m.roomId && goToRoom(m.roomId)}
                  >
                    Join match
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!m.roomId}
                    onClick={() => m.roomId && goToRoom(m.roomId)}
                  >
                    Go to your match
                  </Button>
                )}
              </div>
            ) : (
              <div className="break-words">{m.content}</div>
            )}
          </div>
        ))}
      </div>
    )
  })()

  const handleDmCreated = useCallback(
    (msg: DirectMessage) => {
      const isForThisThread =
        msg.senderId === props.friend.id || msg.recipientId === props.friend.id
      if (!isForThisThread) return

      qc.setQueryData(queryKey, (prev: any) => {
        if (!prev) return prev
        const existing: any[] = prev.messages ?? []
        if (existing.some((m) => m.id === msg.id)) return prev
        return {
          ...prev,
          messages: [...existing, msg],
          pageInfo: {
            ...prev.pageInfo,
            newestCursor: msg.id,
            hasNewer: false,
          },
        }
      })

      if (msg.senderId !== userStore.state?.id) {
        const sound = getDmReceiveSound()
        sound.currentTime = 0
        sound.play().catch(() => {})
      }

      setNewestCursor((c) => c ?? msg.id)
      setOldestCursor((c) => c ?? msg.id)
    },
    [props.friend.id, qc, queryKey],
  )

  useLiveEvent('dm.created', handleDmCreated)

  return (
    <div className="h-full flex flex-col p-3 bg-input/20">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={`Open ${props.friend.username}'s profile`}
          onClick={props.onOpenProfile}
          className="flex min-w-0 items-center gap-2 rounded-sm text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ProfileImage profilePictureId={props.friend.profilePictureId} />
          <span className="truncate font-semibold">
            DM: {props.friend.username}
          </span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="icon-sm"
            aria-label="Invite to match"
            title="Invite to match"
            onClick={() => inviteMutation.mutate()}
            disabled={inviteMutation.isPending}
          >
            <Gamepad2Icon />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            silent={true}
            onClick={props.onClose}
          >
            Close
          </Button>
        </div>
      </div>

      <ScrollArea
        viewportRef={scrollRef}
        onViewportScroll={handleScroll}
        className="mt-3 min-h-0 flex-1 border border-sidebar-border/50 bg-background/30 text-sm clip-pixel-corners-btn"
      >
        <div className="p-2">{messagesContent}</div>
      </ScrollArea>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
        />
        <Button type="submit" silent={true} disabled={sendMutation.isPending}>
          Send
        </Button>
      </form>
    </div>
  )
}
