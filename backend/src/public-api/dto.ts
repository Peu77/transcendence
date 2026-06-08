import { IsString, Length } from 'class-validator'

export class CreateApiKeyDto {
  @IsString()
  @Length(1, 80)
  name!: string
}

export class RenameApiKeyDto {
  @IsString()
  @Length(1, 80)
  name!: string
}
