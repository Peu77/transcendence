import { IsNotEmpty, IsObject, IsString, IsUUID } from 'class-validator'
import { DEFAULT_GAME_CONTROLS, GameControlAction } from './user.entity'

export class ProfilePictureDto {
  @IsUUID()
  id!: string
}

export class VerifyTwoFaDto {
  @IsString()
  @IsNotEmpty()
  code!: string
}

export class UpdateGameControlsDto {
  @IsObject()
  controls!: Record<GameControlAction, string>
}

export const GAME_CONTROL_ACTIONS = Object.values(GameControlAction)
export const DEFAULT_GAME_CONTROL_KEYS = Object.values(DEFAULT_GAME_CONTROLS)
