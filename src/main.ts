import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestExpressApplication } from '@nestjs/platform-express'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.disable('x-powered-by')

  // 全局前缀，排除根路径
  app.setGlobalPrefix('api', {
    exclude: ['', 'health'], // 排除根路径和健康检查路径
  })

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
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })

  // 获取配置服务
  const configService = app.get(ConfigService)
  const port = configService.get<number>('port') || 3000

  await app.listen(port)
  console.log(`应用程序运行在: http://localhost:${port}`)
}
bootstrap()
