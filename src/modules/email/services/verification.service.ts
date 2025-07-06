import { Injectable, Inject, Logger } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { v4 as uuidv4 } from 'uuid'
import { EmailService } from './email.service'
import { VerificationCodeDto } from '../dto/verify-code.dto'

@Injectable()
export class VerificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async requestVerificationCode(
    email: string,
    type: string,
  ): Promise<{
    success: boolean
    uuid: string
  }> {
    const code = this.generateVerificationCode()
    const uuid = uuidv4()
    const expirationTime = 60 * 10 // 10 minutes

    const key = `verificationCode:${uuid}-${email}`
    const value = {
      email,
      code,
      type,
      createdAt: Date.now(),
    }

    try {
      // 存储到Redis
      await this.cacheManager.set(key, JSON.stringify(value), expirationTime * 1000)

      // 发送邮件
      await this.emailService.sendVerificationCode(email, code)

      return {
        success: true,
        uuid,
      }
    } catch (error) {
      this.logger.error('Failed to request verification code', error)
      throw new Error('Failed to request verification code')
    }
  }

  async verifyCode(verificationDto: VerificationCodeDto): Promise<{
    verified: boolean
    message?: string
  }> {
    const { uuid, code, email } = verificationDto
    const key = `verificationCode:${uuid}-${email}`

    try {
      const value = await this.cacheManager.get<string>(key)

      if (!value) {
        return {
          verified: false,
          message: '验证码不存在或已过期',
        }
      }

      const storedData = JSON.parse(value)

      if (code !== storedData.code || email !== storedData.email) {
        return {
          verified: false,
          message: '验证码错误',
        }
      }

      // 删除已使用的验证码
      await this.cacheManager.del(key)

      return {
        verified: true,
      }
    } catch (error) {
      this.logger.error('Failed to verify code', error)
      throw new Error('Failed to verify code')
    }
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }
}
