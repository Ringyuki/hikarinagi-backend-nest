import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { EmailService } from '../services/email.service'
import { VerificationService } from '../services/verification.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { HikariUserGroup } from '../../auth/enums/hikari-user-group.enum'
import { SendEmailDto, RequestVerificationCodeDto, VerificationCodeDto } from '../dto'

@Controller('email')
@UseGuards(ThrottlerGuard, JwtAuthGuard, RolesGuard)
@Roles(HikariUserGroup.USER)
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly verificationService: VerificationService,
  ) {}

  @Post('send')
  @Roles(HikariUserGroup.ADMIN)
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    await this.emailService.sendEmail(sendEmailDto)
    return {
      message: '邮件发送成功',
    }
  }

  @Post('verification-code/request')
  async requestVerificationCode(@Body() requestDto: RequestVerificationCodeDto) {
    const result = await this.verificationService.requestVerificationCode(
      requestDto.email,
      requestDto.type,
    )
    return {
      data: {
        uuid: result.uuid,
        email: requestDto.email,
        type: requestDto.type,
      },
      message: '验证码已发送到您的邮箱',
    }
  }

  @Post('verification-code/verify')
  async verifyCode(@Body() verificationDto: VerificationCodeDto) {
    const result = await this.verificationService.verifyCode(verificationDto)
    return {
      data: {
        verified: result.verified,
        email: verificationDto.email,
      },
      message: result.verified ? '验证码验证成功' : '验证码验证失败',
    }
  }
}
