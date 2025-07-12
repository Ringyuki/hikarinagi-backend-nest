import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ContactDocument = Contact & Document

@Schema({
  timestamps: false,
  versionKey: false,
})
export class Contact {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  contactUser: Types.ObjectId

  @Prop({
    type: String,
    default: null,
  })
  nickname: string

  @Prop({
    type: Boolean,
    default: false,
  })
  isPinned: boolean

  @Prop({
    type: Number,
    default: 0,
  })
  pinnedOder: number

  @Prop({
    type: Types.ObjectId,
    ref: 'PrivateMessage',
    default: null,
  })
  lastMessage: Types.ObjectId

  @Prop({
    type: Date,
    default: null,
  })
  lastMessageTime: Date

  @Prop({
    type: Number,
    default: 0,
  })
  unreadCount: number
}

export const ContactSchema = SchemaFactory.createForClass(Contact)

// 复合索引
ContactSchema.index({ user: 1, contactUser: 1 }, { unique: true })
ContactSchema.index({ user: 1, isPinned: -1, pinnedOder: -1 })
ContactSchema.index({ user: 1, lastMessageTime: -1 })
ContactSchema.index({ user: 1, lastMessage: -1 })
ContactSchema.index({ user: 1, unreadCount: -1 })
