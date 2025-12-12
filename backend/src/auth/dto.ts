import { IsEmail, IsNumberString, IsString, IsUUID, Length } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 128)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 128)
  password!: string;
}

export class TwoFAVerifyDto {
  @IsString()
  @IsNumberString()
  @Length(6, 6)
  token!: string;

  @IsString()
  @Length(20, 20)
  twoFaSecret!: string;

  @IsUUID()
  twoFaId!: string;

  @IsUUID()
  userId!: string;
}

