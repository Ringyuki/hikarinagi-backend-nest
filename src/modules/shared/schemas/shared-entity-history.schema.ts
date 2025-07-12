import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type SharedEntityHistoryDocument = SharedEntityHistory & Document

@Schema({
  timestamps: false,
  versionKey: false,
})
export class SharedEntityHistory {
  @Prop({
    type: String,
    enum: ['producer', 'person', 'character'],
    required: true,
  })
  entityType: string

  @Prop({
    type: Types.ObjectId,
    required: true,
  })
  entityId: Types.ObjectId

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
  userName: string

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

export const SharedEntityHistorySchema = SchemaFactory.createForClass(SharedEntityHistory)

// 创建索引
SharedEntityHistorySchema.index({ entityType: 1, entityId: 1 })
SharedEntityHistorySchema.index({ editedAt: -1 })
SharedEntityHistorySchema.index({ userId: 1 })
