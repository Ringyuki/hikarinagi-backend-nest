import { IsEmail, IsString, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class VerificationCodeDto {
  @ApiProperty({ description: '验证码UUID' })
  @IsUUID(4, { message: '需要提供有效的UUID' })
  uuid: string

  @ApiProperty({ description: '验证码' })
  @IsString({ message: '验证码不能为空' })
  code: string

  @ApiProperty({ description: '邮箱' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
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
