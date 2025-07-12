import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type RateInteractionDocument = RateInteraction & Document

@Schema({
  timestamps: true,
  versionKey: false,
})
export class RateInteraction {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId

  @Prop({
    type: Types.ObjectId,
    ref: 'Rate',
    required: true,
  })
  rate: Types.ObjectId

  @Prop({
    type: String,
    enum: ['like', 'dislike'],
    required: true,
  })
  type: string
}

export const RateInteractionSchema = SchemaFactory.createForClass(RateInteraction)
