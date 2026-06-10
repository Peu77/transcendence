import { IsNotEmpty, IsObject, IsString, IsUUID } from 'class-validator'
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

export class UpdateGameControlsDto {
  @IsObject()
  controls!: Record<GameControlAction, string>
}

export class UpdateTetrisHandlingSettingsDto {
  @IsObject()
  settings!: Record<string, number>
}
