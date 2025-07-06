import { IsEmail, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SendEmailDto {
  @ApiProperty({ description: '邮件主题' })
  @IsString()
  subject: string

  @ApiProperty({ description: '收件人邮箱' })
  @IsEmail()
  to: string

  @ApiProperty({ description: '邮件HTML内容' })
  @IsString()
  bodyHtml: string

  @ApiPropertyOptional({ description: '发件人邮箱' })
  @IsEmail()
  @IsOptional()
  from?: string
}
