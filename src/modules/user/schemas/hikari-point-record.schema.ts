import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { HikariPointAction } from '../types/hikari-point/HikariPointAction'

export type HikariPointsRecordDocument = HikariPointsRecord & Document

@Schema({
  timestamps: true,
})
export class HikariPointsRecord {
  @Prop({ required: true, ref: 'User' })
  userId: Types.ObjectId

  @Prop({ required: true, enum: HikariPointAction })
  action: HikariPointAction

  @Prop({ required: true, type: Number })
  amount: number

  @Prop({ required: true, type: String })
  reason: string

  @Prop({ type: Number, default: 0 })
  balance: number
}

export const HikariPointsRecordSchema = SchemaFactory.createForClass(HikariPointsRecord)
