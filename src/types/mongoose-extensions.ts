import { ToObjectOptions as MongooseToObjectOptions } from 'mongoose'

declare module 'mongoose' {
  interface ToObjectOptions {
    // for user schema
    includeEmail?: boolean
    includeStatus?: boolean
    include_id?: boolean

    // for character schema
    notInclude_id?: boolean

    // for galgame schema
    onlyDownloadInfo?: boolean
    transformToUpdateRequestFormat?: boolean
  }
}

export interface UserToObjectOptions extends MongooseToObjectOptions {
  includeEmail?: boolean
  includeStatus?: boolean
  include_id?: boolean
}

export interface CharacterToObjectOptions extends MongooseToObjectOptions {
  notInclude_id?: boolean
  _transformToUpdateRequestFormat?: boolean
}

export interface GalgameToObjectOptions extends MongooseToObjectOptions {
  onlyDownloadInfo?: boolean
  transformToUpdateRequestFormat?: boolean
}

export interface LightNovelToObjectOptions extends MongooseToObjectOptions {
  transformToUpdateRequestFormat?: boolean
}

export interface PersonToObjectOptions extends MongooseToObjectOptions {
  _transformToUpdateRequestFormat?: boolean
}

export interface ProducerToObjectOptions extends MongooseToObjectOptions {
  _transformToUpdateRequestFormat?: boolean
}

export interface UserSettingToObjectOptions extends MongooseToObjectOptions {
  notInclude_id?: boolean
}
