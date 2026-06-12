import { GarbageCancel, type MatchSettings } from '@transcendence/shared'

export type SoloMatchSettings = Pick<
  MatchSettings,
  | 'gravity'
  | 'gincrease'
  | 'gmargin'
  | 'lockDelayMs'
  | 'hold'
  | 'nextCount'
  | 'forbidInitialSZ'
> & {
  blowbackPercent: number
}

export const DEFAULT_SOLO_MATCH_SETTINGS: SoloMatchSettings = {
  gravity: 0.02,
  gincrease: 0.0025,
  gmargin: 3600,
  lockDelayMs: 300,

  hold: true,
  nextCount: 5,
  forbidInitialSZ: false,
  blowbackPercent: 0,
}

export const createSoloMatchSettings = (
  settings: SoloMatchSettings,
): Partial<MatchSettings> => {
  const { blowbackPercent, ...gameSettings } = settings
  void blowbackPercent

  return {
    ...gameSettings,
    garbage: {
      enabled: true,
      delayMs: 0,
      cancel: GarbageCancel.NONE,
      holeCount: 1,
      messiness: 0,
    },
  }
}

export const areSoloMatchSettingsEqual = (
  left: SoloMatchSettings,
  right: SoloMatchSettings,
) =>
  left.gravity === right.gravity &&
  left.gincrease === right.gincrease &&
  left.gmargin === right.gmargin &&
  left.lockDelayMs === right.lockDelayMs &&
  left.hold === right.hold &&
  left.nextCount === right.nextCount &&
  left.forbidInitialSZ === right.forbidInitialSZ &&
  left.blowbackPercent === right.blowbackPercent
