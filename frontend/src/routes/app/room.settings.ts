import { z } from 'zod'
import {
  RotationSystem,
  PieceRandomizer,
  RoomType,
  GarbageCancel,
} from '@/api/room.ts'

export const matchSettingsSchema = z.object({
  gravity: z.number().min(0).max(20),
  gincrease: z.number().min(0).max(0.5),
  gmargin: z.number().min(0),
  lockDelayMs: z.number().min(0),
  lockResetLimit: z.number().min(0),

  rotationSystem: z.enum(RotationSystem),
  hold: z.boolean(),
  nextCount: z.number().min(0).max(10),
  bag: z.enum(PieceRandomizer),
  forbidInitialSZ: z.boolean(),
  width: z.number().min(4).max(20),
  height: z.number().min(10).max(40),
  hiddenRows: z.number().min(0),
  garbageTargetK: z.number().min(0).max(20),
  garbage: z.object({
    enabled: z.boolean(),
    delayMs: z.number().min(0),
    cancel: z.enum(GarbageCancel),
    holeCount: z.number().min(1),
    messiness: z.number().min(0).max(1),
  }),
  damage: z.object({
    table: z.object({
      single: z.number(),
      double: z.number(),
      triple: z.number(),
      tetris: z.number(),
      tSpinMiniSingle: z.number(),
      tSpinMiniDouble: z.number(),
      tSpinSingle: z.number(),
      tSpinDouble: z.number(),
      tSpinTriple: z.number(),
      allClear: z.number(),
    }),
    comboTable: z.array(z.number()),
    backToBackBonus: z.number(),
    garbageCap: z.number(),
  }),
})

export const roomSettingsSchema = z.object({
  type: z.enum(RoomType),
})

export type RoomSettingsValues = z.infer<typeof roomSettingsSchema>
