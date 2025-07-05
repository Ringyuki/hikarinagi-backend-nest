import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Cookie 解析器
  app.use(cookieParser())

  // 全局前缀
  app.setGlobalPrefix('api', {
    exclude: [''],
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
  app.useGlobalInterceptors(new TransformInterceptor())
  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter())
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
bootstrap()
