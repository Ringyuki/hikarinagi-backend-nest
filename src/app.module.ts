import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { CacheModule } from '@nestjs/cache-manager'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { redisStore } from 'cache-manager-redis-yet'
import config from './common/config'
import { UserModule } from './modules/user/user.module'
import { AuthModule } from './modules/auth/auth.module'
import { RootAppModule } from './common/modules/app.module'
import { APP_GUARD } from '@nestjs/core'

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
    }),

    // 数据库模块
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
    }),

    // 缓存模块 (Redis)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('redis.host')
        const port = configService.get<number>('redis.port')
        const password = configService.get<string>('redis.password')

        return {
          store: await redisStore({
            socket: {
              host,
              port,
            },
            password: password || undefined,
          }),
        }
      },
    }),

    // 限流模块
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),

    // 应用模块
    RootAppModule,
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
