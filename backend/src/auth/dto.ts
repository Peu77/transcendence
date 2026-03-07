import {
  IsEmail,
  IsNumberString,
  IsString,
  IsUUID,
  Length,
} from 'class-validator'

export class RegisterDto {
  @IsString()
  @Length(2, 8)
  username: string

  @IsEmail()
  email!: string

  @IsString()
  @Length(6, 128)
  password!: string
}

export class LoginDto {
  @IsEmail()
  email!: string

  @IsString()
  @Length(6, 128)
  password!: string
}

export class TwoFAVerifyDto {
  @IsString()
  @IsNumberString()
  @Length(6, 6)
  token!: string

  @IsUUID()
  twoFaSessionId!: string

  @IsUUID()
  userId!: string
}
