import { ToObjectOptions as MongooseToObjectOptions } from 'mongoose'

declare module 'mongoose' {
  interface ToObjectOptions {
    // for user schema
    includeEmail?: boolean
    includeStatus?: boolean
    include_id?: boolean
  }
}

export interface UserToObjectOptions extends MongooseToObjectOptions {
  includeEmail?: boolean
  includeStatus?: boolean
  include_id?: boolean
}
