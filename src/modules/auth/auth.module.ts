import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { UserModule } from '../user/user.module'
import { JwtStrategy } from '../../common/strategies/jwt.strategy'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { HikariConfigService } from '../../common/config/configs'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [HikariConfigService],
      useFactory: (configService: HikariConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.hikariAccessTokenExpiresIn'),
        },
      }),
    }),
    UserModule,
  ],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [PassportModule, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
