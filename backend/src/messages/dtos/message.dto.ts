import { IsUUID, IsString, MinLength, MaxLength, IsOptional, IsNumber, Min } from "class-validator";

export class SendMessageDto {
  @IsUUID()
  conversationId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;
}

export class GetConversationDto {
  @IsUUID()
  userId!: string;
}

export class GetMessagesDto {
  @IsUUID()
  conversationId!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

