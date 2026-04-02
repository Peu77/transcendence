import { axios } from '@/lib/client.ts'

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

export async function getUser() {
  const res = await axios.get<User>('/users/me')
  return res.data
}

export async function toggleTheme() {
  const res = await axios.post<Theme>('/users/toggleTheme')
  return res.data
}

export async function logout() {
  const res = await axios.post('/auth/logout')
  return res.data
}
