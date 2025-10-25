import { IsUUID } from "class-validator";

export class ProfilePictureDto {
  @IsUUID()
  id!: string;
}
