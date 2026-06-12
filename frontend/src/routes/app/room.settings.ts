import { z } from 'zod'
import {
  GarbageCancel,
  PieceRandomizer,
  RoomType,
  RotationSystem,
} from '@/api/room.ts'

export const matchSettingsSchema = z.object({
  gravity: z.number().min(0).max(20),
  gincrease: z.number().min(0).max(0.5),
  gmargin: z.number().min(0).max(10000),
  lockDelayMs: z.number().min(0).max(2000),
  lockResetLimit: z.number().min(0).max(30),

  rotationSystem: z.enum(RotationSystem),
  hold: z.boolean(),
  nextCount: z.number().min(0).max(10),
  bag: z.enum(PieceRandomizer),
  forbidInitialSZ: z.boolean(),
  width: z.number().min(4).max(20),
  height: z.number().min(10).max(40),
  hiddenRows: z.number().min(0).max(20),
  garbageTargetK: z.number().min(0).max(20),
  garbage: z.object({
    enabled: z.boolean(),
    delayMs: z.number().min(0).max(5000),
    cancel: z.enum(GarbageCancel),
    holeCount: z.number().min(1).max(4),
    messiness: z.number().min(0).max(1),
  }),
  damage: z.object({
    table: z.object({
      single: z.number().min(0).max(10),
      double: z.number().min(0).max(10),
      triple: z.number().min(0).max(10),
      tetris: z.number().min(0).max(20),
      tSpinMiniSingle: z.number().min(0).max(5),
      tSpinMiniDouble: z.number().min(0).max(10),
      tSpinSingle: z.number().min(0).max(10),
      tSpinDouble: z.number().min(0).max(15),
      tSpinTriple: z.number().min(0).max(20),
      allClear: z.number().min(0).max(20),
    }),
    comboTable: z.array(z.number()),
    backToBackBonus: z.number().min(0).max(10),
    garbageCap: z.number().min(1).max(20),
  }),
})

export const roomSettingsSchema = z.object({
  type: z.enum(RoomType),
})

export type RoomSettingsValues = z.infer<typeof roomSettingsSchema>
