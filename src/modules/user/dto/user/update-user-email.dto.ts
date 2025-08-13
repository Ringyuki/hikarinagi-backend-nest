import { IsString, IsEmail, IsUUID, IsNotEmpty } from 'class-validator'

export class UpdateUserEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  code: string

  @IsUUID()
  @IsNotEmpty()
  uuid: string
}
