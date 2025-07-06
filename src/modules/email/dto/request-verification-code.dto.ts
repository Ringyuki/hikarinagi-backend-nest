import { IsEmail, IsString, IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RequestVerificationCodeDto {
  @ApiProperty({ description: '邮箱' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string

  @ApiProperty({ description: '验证码类型' })
  @IsString({ message: '验证码类型不能为空' })
  @IsIn(['registration', 'password-reset', 'email-change', 'login'], {
    message: '验证码类型必须是: registration, password-reset, email-change, login 之一',
  })
  type: string
}
