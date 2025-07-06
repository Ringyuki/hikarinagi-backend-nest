import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { MongooseModule } from '@nestjs/mongoose'
import { CacheModule } from '@nestjs/cache-manager'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { redisStore } from 'cache-manager-redis-yet'
import config from './common/config'
import { HikariConfigModule } from './common/config/config.module'
import { HikariConfigService } from './common/config'
import { UserModule } from './modules/user/user.module'
import { AuthModule } from './modules/auth/auth.module'
import { EmailModule } from './modules/email/email.module'
import { RootAppModule } from './common/modules/app.module'
import { APP_GUARD } from '@nestjs/core'

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
    }),
    HikariConfigModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [HikariConfigService],
      useFactory: (configService: HikariConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.hikariAccessTokenExpiresIn'),
        },
      }),
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
    EmailModule,
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
