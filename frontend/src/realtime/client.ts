import { io, type Socket } from 'socket.io-client'
import { env } from '@/env'
import type { LiveEventMap } from './events'

type ClientToServerEvents = {
  'dm.join': (body: { withUserId: string }) => void
  'dm.leave': (body: { withUserId: string }) => void
  'room.join': (
    body: { roomId: string },
    callback: (res: { ok: boolean; error?: string }) => void,
  ) => void
  'room.leave': (body: { roomId: string }) => void
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
