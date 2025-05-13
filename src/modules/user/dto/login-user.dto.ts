import { IsNotEmpty, IsString } from 'class-validator'

export class LoginUserDto {
  @IsNotEmpty({ message: '用户名/邮箱不能为空' })
  @IsString({ message: '用户名/邮箱必须是字符串' })
  identifier: string

  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  password: string
}
