import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { SendIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { useLiveEvent } from '@/realtime/hooks.ts'
import { useLiveSocket } from '@/realtime/useRealtimeStore.ts'
import type { RoomChatMessageEvent } from '@/realtime/events.ts'
import { cn } from '@/lib/utils.ts'
import { useRoomTypingIndicator } from '@/hooks/use-typing-indicator.ts'

let sendSound: HTMLAudioElement | null = null
let receiveSound: HTMLAudioElement | null = null
function getSendSound() {
  if (!sendSound) sendSound = new Audio('/sounds/message_send.mp3')
  return sendSound
}
function getReceiveSound() {
  if (!receiveSound) receiveSound = new Audio('/sounds/message_receive.mp3')
  return receiveSound
}

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
  const { typingUsers, emitTyping } = useRoomTypingIndicator(
    roomId,
    currentUserId,
  )

  useLiveEvent(
    'room.chat.message',
    useCallback(
      (message: RoomChatMessageEvent) => {
        if (message.roomId !== roomId) return
        setMessages((current) => [...current, message])
        if (message.senderId !== currentUserId) {
          const sound = getReceiveSound()
          sound.currentTime = 0
          sound.play().catch(() => {})
        }
      },
      [roomId, currentUserId],
    ),
  )

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
      } else {
        const sound = getSendSound()
        sound.currentTime = 0
        sound.play().catch(() => {})
      }
    })
    setDraftMessage('')
  }

  return (
    <section
      className={cn('flex min-h-0 flex-col bg-background/80 px-7', className)}
    >
      <div className="border-b border-border/70 pb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wide">
          Room chat
        </h2>
        <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
          Talk to everyone currently in this room.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-1.5 overflow-y-auto py-6"
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
                className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'relative max-w-[80%] rounded-lg px-3 py-1.5 text-sm shadow-sm',
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none',
                  )}
                >
                  {!isMine && (
                    <div className="mb-0.5 text-[11px] font-semibold text-foreground/70">
                      {message.senderInfo.username}
                    </div>
                  )}
                  <div className="break-words wrap-break-word">
                    {message.content}
                  </div>
                  <div
                    className={cn(
                      'mt-0.5 flex items-center gap-1 text-[10px]',
                      isMine
                        ? 'justify-end text-primary-foreground/60'
                        : 'justify-start text-muted-foreground',
                    )}
                  >
                    <span>{formatMessageTime(message.createdAt)}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {typingUsers.length > 0 && (
        <div className="px-1 pb-1 text-xs text-muted-foreground animate-pulse">
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : typingUsers.length === 2
              ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
              : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-3 border-t border-border/70 pt-5"
      >
        <Input
          ref={inputRef}
          value={draftMessage}
          onChange={(e) => {
            setDraftMessage(e.target.value)
            if (e.target.value.trim()) emitTyping()
          }}
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
