import { axios } from '@/lib/client.ts'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export type User = {
  id: string
  email: string
  profilePictureId: string | null
  username: string
  twoFaEnabled: boolean
  theme: Theme
}

export const USER_QUERY_KEYS = {
  USER: ['user'],
  PUBLIC_PROFILE: (userId: string) => ['publicProfile', userId],
}

export function useGetUser() {
  return useQuery({
    queryKey: USER_QUERY_KEYS.USER,
    queryFn: async () => {
      const user = await axios.get<User>('/users/me')
      return user.data
    },
  })
}

export type PublicProfile = {
  id: string
  username: string
  profilePictureId: string | null
  level: number
  createdAt: string
}

export async function getPublicProfile(userId: string) {
  const res = await axios.get<PublicProfile>(`/users/profile/${userId}`)
  return res.data
}

export function useGetPublicProfile(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.PUBLIC_PROFILE(userId),
    queryFn: () => getPublicProfile(userId),
    enabled,
  })
}

export function timeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

export async function toggleTheme() {
  const res = await axios.post<Theme>('/users/toggleTheme')
  return res.data
}

export async function logout() {
  const res = await axios.post('/auth/logout')
  return res.data
}
