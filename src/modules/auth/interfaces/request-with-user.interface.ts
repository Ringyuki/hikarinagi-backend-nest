import { Request } from 'express'
import { UserSettingDocument } from '../../user/schemas/user-setting.schema'

export interface RequestWithUser extends Request {
  user: {
    _id: string
    userId: string
    name: string
    hikariUserGroup: string
    email: string
    userSetting: UserSettingDocument
  }
}
