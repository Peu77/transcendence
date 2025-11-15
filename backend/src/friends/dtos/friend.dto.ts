import { IsUUID } from "class-validator";

export class SendFriendRequestDto {
  @IsUUID()
  receiverId!: string;
}

export class AcceptFriendRequestDto {
  @IsUUID()
  requestId!: string;
}

export class RejectFriendRequestDto {
  @IsUUID()
  requestId!: string;
}

export class CancelFriendRequestDto {
  @IsUUID()
  requestId!: string;
}

export class UnfriendDto {
  @IsUUID()
  friendId!: string;
}

