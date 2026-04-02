import { axios } from '@/lib/client.ts'
import { useQuery } from '@tanstack/react-query'

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

export async function toggleTheme() {
  const res = await axios.post<Theme>('/users/toggleTheme')
  return res.data
}

export async function logout() {
  const res = await axios.post('/auth/logout')
  return res.data
}
