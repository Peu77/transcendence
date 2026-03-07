import { IsUUID, IsString, IsNotEmpty } from 'class-validator'

export class ProfilePictureDto {
  @IsUUID()
  id!: string
}

export class VerifyTwoFaDto {
  @IsString()
  @IsNotEmpty()
  code!: string
}
