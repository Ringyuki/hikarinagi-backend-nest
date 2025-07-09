import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema()
export class GalgameHistory {
  @Prop({ type: String })
  galId: string

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

export type GalgameHistoryDocument = GalgameHistory & Document
export const GalgameHistorySchema = SchemaFactory.createForClass(GalgameHistory)
