import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { GameControlAction } from './user.entity'

export class ProfilePictureDto {
  @IsUUID()
  id!: string
}

export class VerifyTwoFaDto {
  @IsString()
  @IsNotEmpty()
  code!: string
}

export class GameControlsDto {
  @IsString()
  @MaxLength(50)
  [GameControlAction.LEFT]!: string;

  @IsString()
  @MaxLength(50)
  [GameControlAction.RIGHT]!: string;

  @IsString()
  @MaxLength(50)
  [GameControlAction.ROTATE_CW]!: string;

  @IsString()
  @MaxLength(50)
  [GameControlAction.ROTATE_CCW]!: string;

  @IsString()
  @MaxLength(50)
  [GameControlAction.ROTATE_180]!: string;

  @IsString()
  @MaxLength(50)
  [GameControlAction.SOFT_DROP]!: string;

  @IsString()
  @MaxLength(50)
  [GameControlAction.HARD_DROP]!: string;

  @IsString()
  @MaxLength(50)
  [GameControlAction.HOLD]!: string;

  @IsString()
  @MaxLength(50)
  [GameControlAction.TOGGLE_CHAT]!: string
}

export class UpdateGameControlsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => GameControlsDto)
  controls!: GameControlsDto
}

export class TetrisHandlingSettingsDto {
  @IsNumber()
  @Min(0)
  @Max(1000)
  arr!: number

  @IsNumber()
  @Min(0)
  @Max(1000)
  das!: number

  @IsNumber()
  @Min(0)
  @Max(1000)
  dcd!: number

  @IsNumber()
  @Min(0)
  @Max(1000)
  sdf!: number
}

export class UpdateTetrisHandlingSettingsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => TetrisHandlingSettingsDto)
  settings!: TetrisHandlingSettingsDto
}
