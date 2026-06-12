import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { PresenceStatus } from './entities/user-presence.entity'
import { Type } from 'class-transformer'

export class SendFriendRequestDto {
  // Identifier can be a username or user ID
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  userIdentifier!: string
}

export class SendDirectMessageDto {
  @IsString()
  @MinLength(1)
  content!: string
}

export class InviteToMatchDto {
  @IsOptional()
  @IsString()
  roomId?: string
}

export class GetMessagesQueryDto {
  @IsOptional()
  @IsUUID()
  before?: string

  @IsOptional()
  @IsUUID()
  after?: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number
}

export class UpdatePresenceDto {
  @IsEnum(PresenceStatus)
  status!: PresenceStatus
}
