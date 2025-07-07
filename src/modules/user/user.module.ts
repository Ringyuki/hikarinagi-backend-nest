import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserController } from './controllers/user.controller'
import { UserService } from './services/user.service'
import { User, UserSchema } from './schemas/user.schema'
import { UserSetting, UserSettingSchema } from './schemas/user-setting.schema'
import { UserSearchService } from './services/user-search.service'
import { UserSearchController } from './controllers/user-search.controller'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserSetting.name, schema: UserSettingSchema },
    ]),
    EmailModule,
  ],
  controllers: [UserController, UserSearchController],
  providers: [UserService, UserSearchService],
  exports: [UserService],
})
export class UserModule {}
