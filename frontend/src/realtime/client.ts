import { io, type Socket } from 'socket.io-client'
import { env } from '@/env'
import type { LiveEventMap } from './events'
import type { InputAction } from '@transcendence/shared'

type ClientToServerEvents = {
  'dm.join': (body: { withUserId: string }) => void
  'dm.leave': (body: { withUserId: string }) => void
  'room.join': (
    body: { roomId: string },
    callback: (res: { ok: boolean; error?: string }) => void,
  ) => void
  'room.leave': (body: { roomId: string }) => void
  'room.chat.send': (
    body: { roomId: string; content: string },
    callback: (res: { ok: boolean; error?: string }) => void,
  ) => void
  'game.start': (
    body: { roomId: string },
    callback: (res: { ok: boolean; error?: string }) => void,
  ) => void
  'game.input': (body: { roomId: string; action: InputAction; seq?: number }) => void
}

type ServerToClientEvents = LiveEventMap

export type LiveSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export function createLiveSocket(): LiveSocket {
  const url = new URL(env.VITE_BACKEND_URL)

  const baseUrl = `${url.protocol}//${url.host}`

  return io(`${baseUrl}/live`, {
    withCredentials: true,
    autoConnect: false,
    transports: ['websocket'],
  })
}
