import { Request } from 'express'

export interface RequestWithUser extends Request {
  user: {
    _id: string
    userId: string
    name: string
    hikariUserGroup: string
  }
}
