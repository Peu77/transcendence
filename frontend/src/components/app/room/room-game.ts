import {
  DEFAULT_GAME_CONTROLS,
  DEFAULT_TETRIS_HANDLING_SETTINGS,
  type GameControls,
  type TetrisHandlingSettings,
} from '@/api/user.ts'
import type { InputAction } from '@transcendence/shared'

export type GamePhase = 'lobby' | 'countdown' | 'playing' | 'finished'

/** Actions the game engine actually understands (everything except chat). */
const VALID_INPUT_ACTIONS = new Set<InputAction>([
  'left',
  'right',
  'rotateCW',
  'rotateCCW',
  'rotate180',
  'softDrop',
  'hardDrop',
  'hold',
])

export const buildKeyMap = (
  controls?: GameControls,
): Record<string, InputAction> => {
  const normalizedControls = { ...DEFAULT_GAME_CONTROLS, ...controls }

  return Object.entries(normalizedControls).reduce<Record<string, InputAction>>(
    (keyMap, [action, key]) => {
      if (!VALID_INPUT_ACTIONS.has(action as InputAction)) return keyMap
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
