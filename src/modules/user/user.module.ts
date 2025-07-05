import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserController } from './controllers/user.controller'
import { UserService } from './services/user.service'
import { User, UserSchema } from './schemas/user.schema'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import { HikariConfigService } from '../../common/config'
import { UserSearchService } from './services/user-search.service'
import { UserSearchController } from './controllers/user-search.controller'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
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
  ],
  controllers: [UserController, UserSearchController],
  providers: [UserService, UserSearchService],
  exports: [UserService],
})
export class UserModule {}
