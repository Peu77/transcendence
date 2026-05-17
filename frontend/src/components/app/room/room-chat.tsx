import { useEffect, useRef, useState, type FormEvent } from 'react'
import { SendIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { useLiveEvent } from '@/realtime/hooks.ts'
import { useLiveSocket } from '@/realtime/useRealtimeStore.ts'
import type { RoomChatMessageEvent } from '@/realtime/events.ts'
import { cn } from '@/lib/utils.ts'

type RoomChatProps = {
  roomId: string
  currentUserId?: string
  className?: string
  autoFocus?: boolean
}

const formatMessageTime = (date: string) => {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function RoomChat({
  roomId,
  currentUserId,
  className,
  autoFocus = false,
}: RoomChatProps) {
  const socket = useLiveSocket()
  const [messages, setMessages] = useState<RoomChatMessageEvent[]>([])
  const [draftMessage, setDraftMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useLiveEvent('room.chat.message', (message) => {
    if (message.roomId !== roomId) return
    setMessages((current) => [...current, message])
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const content = draftMessage.trim()
    if (!socket || !content) return

    socket.emit('room.chat.send', { roomId, content }, (res) => {
      if (!res?.ok) {
        toast.error(res?.error || 'Failed to send message')
      }
    })
    setDraftMessage('')
  }

  return (
    <section
      className={cn(
        'flex min-h-0 flex-col bg-background/80 px-7 py-9',
        className,
      )}
    >
      <div className="border-b border-border/70 pb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wide">Room chat</h2>
        <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
          Talk to everyone currently in this room.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto py-6"
      >
        {messages.length === 0 ? (
          <pre className="flex flex-col h-full items-center justify-center p-4 text-center text-xl uppercase tracking-wide text-muted-foreground">
            <p>No messages yet</p>
            <p>Start chatting!</p>
          </pre>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === currentUserId
            return (
              <div
                key={message.id}
                className={cn('flex flex-col gap-1', isMine && 'items-end')}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/80">
                    {message.senderInfo.username}
                  </span>
                  <span>{formatMessageTime(message.createdAt)}</span>
                </div>
                <div
                  className={cn(
                    'max-w-[85%] border px-3 py-2 text-sm leading-relaxed shadow-sm text-wrap wrap-break-word clip-pixel-corners-btn',
                    isMine
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted text-foreground',
                  )}
                >
                  {message.content}
                </div>
              </div>
            )
          })
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-3 border-t border-border/70 pt-5"
      >
        <Input
          ref={inputRef}
          value={draftMessage}
          onChange={(e) => setDraftMessage(e.target.value)}
          maxLength={500}
          placeholder="Type a message..."
        />
        <Button type="submit" size="icon" disabled={!draftMessage.trim()}>
          <SendIcon className="size-4" />
        </Button>
      </form>
    </section>
  )
}
