import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type HikariPointsRecordDocument = HikariPointsRecord & Document

@Schema({
  timestamps: true,
})
export class HikariPointsRecord {
  @Prop({ required: true, ref: 'User' })
  userId: Types.ObjectId

  @Prop({ required: true, enum: ['add', 'subtract'] })
  action: 'add' | 'subtract'

  @Prop({ required: true, type: Number })
  amount: number

  @Prop({ required: true, type: String })
  reason: string

  @Prop({ type: Number, default: 0 })
  balance: number
}

export const HikariPointsRecordSchema = SchemaFactory.createForClass(HikariPointsRecord)
