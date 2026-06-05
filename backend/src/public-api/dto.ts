import { IsOptional, IsString, Length } from 'class-validator'

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

export class PublicApiKeyHeaderDto {
  @IsOptional()
  @IsString()
  authorization?: string

  @IsOptional()
  @IsString()
  'x-api-key'?: string
}
