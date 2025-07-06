import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { Document } from 'mongoose'

export type UserSettingDocument = UserSetting & Document

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret.__v
      return ret
    },
  },
})
export class UserSetting {
  @Prop({ required: true, ref: 'User' })
  user: mongoose.Types.ObjectId

  @Prop({ default: false })
  showNSFWContent: boolean
}

export const UserSettingSchema = SchemaFactory.createForClass(UserSetting)
