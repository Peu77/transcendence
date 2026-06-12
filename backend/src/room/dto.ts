import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import {
  GarbageCancel,
  PieceRandomizer,
  RoomType,
  RotationSystem,
} from './types'

export class GarbageSettingsDto {
  @IsBoolean()
  enabled!: boolean

  @IsNumber()
  @Min(0)
  @Max(5000)
  delayMs!: number

  @IsEnum(GarbageCancel)
  cancel!: GarbageCancel

  @IsNumber()
  @Min(1)
  @Max(4)
  holeCount!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  messiness!: number
}

export class DamageTableDto {
  @IsNumber()
  @Min(0)
  @Max(10)
  single!: number

  @IsNumber()
  @Min(0)
  @Max(10)
  double!: number

  @IsNumber()
  @Min(0)
  @Max(10)
  triple!: number

  @IsNumber()
  @Min(0)
  @Max(20)
  tetris!: number

  @IsNumber()
  @Min(0)
  @Max(5)
  tSpinMiniSingle!: number

  @IsNumber()
  @Min(0)
  @Max(10)
  tSpinMiniDouble!: number

  @IsNumber()
  @Min(0)
  @Max(10)
  tSpinSingle!: number

  @IsNumber()
  @Min(0)
  @Max(15)
  tSpinDouble!: number

  @IsNumber()
  @Min(0)
  @Max(20)
  tSpinTriple!: number

  @IsNumber()
  @Min(0)
  @Max(20)
  allClear!: number
}

export class DamageSettingsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => DamageTableDto)
  table!: DamageTableDto

  @IsArray()
  @IsNumber({}, { each: true })
  comboTable!: number[]

  @IsNumber()
  @Min(0)
  @Max(10)
  backToBackBonus!: number

  @IsNumber()
  @Min(1)
  @Max(20)
  garbageCap!: number
}

export class UpdateMatchSettingsDto {
  @IsNumber()
  @Min(0)
  @Max(20)
  gravity!: number

  @IsNumber()
  @Min(0)
  @Max(20)
  gincrease!: number

  @IsNumber()
  @Min(0)
  @Max(10000)
  gmargin!: number

  @IsNumber()
  @Min(0)
  @Max(2000)
  lockDelayMs!: number

  @IsNumber()
  @Min(0)
  @Max(30)
  lockResetLimit!: number

  @IsEnum(RotationSystem)
  rotationSystem!: RotationSystem

  @IsBoolean()
  hold!: boolean

  @IsNumber()
  @Min(0)
  @Max(10)
  nextCount!: number

  @IsEnum(PieceRandomizer)
  bag!: PieceRandomizer

  @IsBoolean()
  forbidInitialSZ!: boolean

  @IsNumber()
  @Min(4)
  @Max(20)
  width!: number

  @IsNumber()
  @Min(10)
  @Max(40)
  height!: number

  @IsNumber()
  @Min(0)
  @Max(20)
  hiddenRows!: number

  @IsNumber()
  @Min(0)
  @Max(20)
  garbageTargetK!: number

  @IsObject()
  @ValidateNested()
  @Type(() => GarbageSettingsDto)
  garbage!: GarbageSettingsDto

  @IsObject()
  @ValidateNested()
  @Type(() => DamageSettingsDto)
  damage!: DamageSettingsDto
}

export class UpdateRoomSettingsDto {
  @IsEnum(RoomType)
  type!: RoomType
}
