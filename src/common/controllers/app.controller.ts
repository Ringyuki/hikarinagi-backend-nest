import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getAppInfo() {
    return {
      name: 'Hikarinagi backend nestjs',
      version: '0.0.1',
      message: '',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    }
  }
}
