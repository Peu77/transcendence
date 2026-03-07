import type { MatchSettings, Room } from '@/api/room.ts'
import type { RoomSettingsValues } from '../../../routes/app/room.settings.ts'

export type RoomFormCommonProps = {
  room: Room
  isHost: boolean
}

export type MatchSettingsFormProps = RoomFormCommonProps & {
  isSaving: boolean
  onSave: (settings: MatchSettings) => void
}

export type RoomSettingsFormProps = RoomFormCommonProps & {
  isSaving: boolean
  onSave: (data: RoomSettingsValues) => void
}

export type RoomPlayersSidebarProps = {
  room: Room
  currentUserId?: string
}
