import { IsNotEmpty, IsString } from 'class-validator'

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'refreshToken不能为空' })
  @IsString({ message: 'refreshToken必须是字符串' })
  refreshToken: string
}
