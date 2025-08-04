import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { EnvironmentValidator } from './common/config/validators/env.validator'
import * as cookieParser from 'cookie-parser'
import { VersionService } from './common/services/version.service'
import { NestExpressApplication } from '@nestjs/platform-express'

EnvironmentValidator.validateEnvironment()

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.disable('x-powered-by')
  const configService = app.get(ConfigService)

  // Cookie 解析器
  app.use(cookieParser())

  // 全局前缀
  app.setGlobalPrefix('api', {
    exclude: ['', 'health'],
  })
  // 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  // 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor(app.get(VersionService)))
  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter(app.get(VersionService)))
  // CORS
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  const port = configService.get<number>('port')

  await app.listen(port)
  console.log(`hikarinagi backend running on: http://localhost:${port}`)
}

// 处理未捕获的异常和拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

bootstrap()
