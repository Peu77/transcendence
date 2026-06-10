import { axios } from '@/lib/client.ts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export type GameControlAction =
  | 'left'
  | 'right'
  | 'rotateCW'
  | 'rotateCCW'
  | 'rotate180'
  | 'softDrop'
  | 'hardDrop'
  | 'hold'
  | 'toggleChat'

export type GameControls = Record<GameControlAction, string>

export type TetrisHandlingSettings = {
  arr: number
  das: number
  dcd: number
  sdf: number
}

export const DEFAULT_GAME_CONTROLS: GameControls = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  rotateCW: 'x',
  rotateCCW: 'z',
  rotate180: 'a',
  softDrop: 'ArrowDown',
  hardDrop: ' ',
  hold: 'c',
  toggleChat: 't',
}

export const DEFAULT_TETRIS_HANDLING_SETTINGS: TetrisHandlingSettings = {
  arr: 33,
  das: 167,
  dcd: 0,
  sdf: 33,
}

export type User = {
  id: string
  email: string
  profilePictureId: string | null
  username: string
  twoFaEnabled: boolean
  theme: Theme
  gameControls: GameControls
  tetrisHandlingSettings: TetrisHandlingSettings
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

export function useUploadProfilePicture() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await axios.post<{
        message: string
        profilePictureId: string
      }>('/users/profilePicture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return res.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.USER })
    },
  })
}

export function useUpdateGameControls() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (controls: GameControls) => {
      const res = await axios.post<{ gameControls: GameControls }>(
        '/users/gameControls',
        { controls },
      )
      return res.data.gameControls
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.USER })
    },
  })
}

export function useUpdateTetrisHandlingSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: TetrisHandlingSettings) => {
      const res = await axios.post<{
        tetrisHandlingSettings: TetrisHandlingSettings
      }>('/users/tetrisHandlingSettings', { settings })
      return res.data.tetrisHandlingSettings
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.USER })
    },
  })
}

export type PublicProfile = {
  id: string
  username: string
  profilePictureId: string | null
  createdAt: string
  totalScore: number | null
  totalLines: number
  rank: number | null
  blockedByThem: boolean
  sharedMatchCount: number
  sharedPoints: number
  requesterTotalPoints: number
  winsAgainstThem: number
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
