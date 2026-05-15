import {
  DEFAULT_GAME_CONTROLS,
  DEFAULT_TETRIS_HANDLING_SETTINGS,
  type GameControls,
  type TetrisHandlingSettings,
} from '@/api/user.ts'
import type { InputAction } from '@/game/tetris/types'

export type GamePhase =
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'finished'

export const buildKeyMap = (
  controls?: GameControls,
): Record<string, InputAction> => {
  const normalizedControls = { ...DEFAULT_GAME_CONTROLS, ...controls }

  return Object.entries(normalizedControls).reduce<Record<string, InputAction>>(
    (keyMap, [action, key]) => {
      if (action === 'toggleChat') return keyMap
      keyMap[key] = action as InputAction
      return keyMap
    },
    {},
  )
}

export const normalizeGameControls = (
  controls?: GameControls,
): GameControls => ({
  ...DEFAULT_GAME_CONTROLS,
  ...controls,
})

export const normalizeHandlingSettings = (
  settings?: TetrisHandlingSettings,
): TetrisHandlingSettings => ({
  ...DEFAULT_TETRIS_HANDLING_SETTINGS,
  ...settings,
})
