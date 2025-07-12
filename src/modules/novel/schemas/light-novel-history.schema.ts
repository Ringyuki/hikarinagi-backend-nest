import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type LightNovelHistoryDocument = LightNovelHistory & Document

@Schema({
  timestamps: false,
  versionKey: false,
})
export class LightNovelHistory {
  @Prop({ type: String })
  novelId: string

  @Prop({
    type: String,
    enum: ['create', 'update', 'delete'],
    required: true,
  })
  actionType: string

  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: 'User',
  })
  userId: Types.ObjectId

  @Prop({
    type: String,
    required: true,
  })
  name: string

  @Prop({
    type: Date,
    default: Date.now,
  })
  editedAt: Date

  @Prop({
    type: String,
    required: true,
  })
  changes: string

  @Prop({
    type: Object,
    required: true,
  })
  detailedChanges: object
}

export const LightNovelHistorySchema = SchemaFactory.createForClass(LightNovelHistory)
