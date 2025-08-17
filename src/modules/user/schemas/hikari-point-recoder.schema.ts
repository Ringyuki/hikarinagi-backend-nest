import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type HikariPointsRecoderDocument = HikariPointsRecoder & Document

@Schema({
  timestamps: true,
})
export class HikariPointsRecoder {
  @Prop({ required: true, ref: 'User' })
  userId: string

  @Prop({ required: true, enum: ['add', 'subtract'] })
  action: 'add' | 'subtract'

  @Prop({ required: true, type: Number })
  amount: number

  @Prop({ required: true, type: String })
  reason: string

  @Prop({ type: Number, default: 0 })
  balance: number
}

export const HikariPointsRecoderSchema = SchemaFactory.createForClass(HikariPointsRecoder)
