import { IsEmail, IsString, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class VerificationCodeDto {
  @ApiProperty({ description: '验证码UUID' })
  @IsUUID()
  uuid: string

  @ApiProperty({ description: '验证码' })
  @IsString()
  code: string

  @ApiProperty({ description: '邮箱' })
  @IsEmail()
  email: string
}

export class RequestVerificationCodeDto {
  @ApiProperty({ description: '邮箱' })
  @IsEmail()
  email: string

  @ApiProperty({ description: '验证码类型' })
  @IsString()
  type: string
}
