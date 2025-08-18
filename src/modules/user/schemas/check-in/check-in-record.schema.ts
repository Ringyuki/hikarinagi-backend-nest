import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type CheckInRecordDocument = CheckInRecord & Document

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret._id
      delete ret.__v
      delete ret.userId
      delete ret.createdAt
      delete ret.updatedAt
    },
  },
})
export class CheckInRecord {
  @Prop({ required: true, ref: 'User' })
  userId: Types.ObjectId

  @Prop({ required: true, type: Date })
  date: Date

  @Prop({ type: Boolean, default: false })
  isMakeUp: boolean

  @Prop({ type: Number, default: 0 })
  points: number

  @Prop({ type: Number, default: 0 })
  streakAfter: number
}

export const CheckInRecordSchema = SchemaFactory.createForClass(CheckInRecord)
CheckInRecordSchema.index({ userId: 1, date: 1 }, { unique: true })
CheckInRecordSchema.index({ userId: 1, date: 1, isMakeUp: 1 })
