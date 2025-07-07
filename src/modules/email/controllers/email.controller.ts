import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
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
  @HttpCode(HttpStatus.OK)
  @Roles(HikariUserGroup.ADMIN)
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    await this.emailService.sendEmail(sendEmailDto)
    return {
      message: '邮件发送成功',
    }
  }

  @Post('verification-code/request')
  @HttpCode(HttpStatus.OK)
  async requestVerificationCode(
    @Req() req: RequestWithUser,
    @Body() requestDto: RequestVerificationCodeDto,
  ) {
    const result = await this.verificationService.requestVerificationCode(
      requestDto.email,
      requestDto.type,
      req,
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
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body() verificationDto: VerificationCodeDto) {
    const result = await this.verificationService.verifyCode(verificationDto)
    return {
      data: {
        verified: result.verified,
        email: verificationDto.email,
      },
      message: result.verified ? '验证码验证成功' : result.message,
    }
  }
}
