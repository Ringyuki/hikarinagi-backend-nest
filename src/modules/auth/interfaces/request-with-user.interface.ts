import { Request } from 'express'
import { UserSettingDocument } from '../../user/schemas/user-setting.schema'
import { HikariUserGroup } from '../enums/hikari-user-group.enum'

export interface RequestWithUser extends Request {
  user: {
    _id: string
    userId: string
    name: string
    hikariUserGroup: HikariUserGroup
    email: string
    userSetting: UserSettingDocument
  }
}
