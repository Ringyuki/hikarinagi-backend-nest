import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class VerificationForSignupDto {
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string

  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名格式不正确' })
  name: string
}
