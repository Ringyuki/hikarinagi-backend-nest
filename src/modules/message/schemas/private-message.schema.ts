import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type PrivateMessageDocument = PrivateMessage & Document

@Schema({
  timestamps: false,
  versionKey: false,
})
export class PrivateMessage {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  senderId: Types.ObjectId

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  receiverId: Types.ObjectId

  @Prop({
    type: String,
    required: true,
  })
  content: string

  @Prop({
    type: Date,
    default: Date.now,
  })
  sentAt: Date

  @Prop({
    type: Boolean,
    default: false,
  })
  isRead: boolean

  @Prop({
    type: Date,
    default: null,
  })
  readAt: Date
}

export const PrivateMessageSchema = SchemaFactory.createForClass(PrivateMessage)
