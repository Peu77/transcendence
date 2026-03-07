export const REALTIME_NAMESPACE = '/live'

export const userRoom = (userId: string) => `user:${userId}`

export const gameRoom = (roomId: string) => `game:${roomId}`

export const dmRoom = (a: string, b: string) => {
  const low = a < b ? a : b
  const high = a < b ? b : a
  return `dm:${low}:${high}`
}
