import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { EntityType } from '../dto/create-update-request.dto'

export type UpdateRequestDocument = UpdateRequest & Document

@Schema({ _id: false })
export class UpdateRequestChanges {
  @Prop({
    type: Object,
    required: true,
  })
  previous: object

  @Prop({
    type: Object,
    required: true,
  })
  updated: object

  @Prop({
    type: [String],
    required: false,
    default: [],
  })
  changedFields: string[]
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class UpdateRequest {
  @Prop({
    type: String,
    enum: ['Galgame', 'LightNovel', 'LightNovelVolume', 'Producer', 'Person', 'Character'],
    required: true,
  })
  entityType: EntityType

  @Prop({
    type: Types.ObjectId,
    required: true,
    refPath: 'entityType',
  })
  entityId: Types.ObjectId

  @Prop({
    type: String,
    required: true,
    maxlength: 100,
  })
  title: string

  @Prop({
    type: String,
    required: true,
    maxlength: 2000,
  })
  description: string

  @Prop({
    type: String,
    enum: ['pending', 'merged', 'rejected'],
    default: 'pending',
  })
  status: string

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  requestedBy: Types.ObjectId

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  processedBy: Types.ObjectId

  @Prop({
    type: Date,
    default: null,
  })
  processedAt: Date

  @Prop({
    type: String,
    default: null,
  })
  rejectionReason: string

  @Prop({ type: UpdateRequestChanges })
  changes: UpdateRequestChanges
}

export const UpdateRequestSchema = SchemaFactory.createForClass(UpdateRequest)

// 创建索引
UpdateRequestSchema.index({ entityType: 1, entityId: 1 })
UpdateRequestSchema.index({ status: 1 })
UpdateRequestSchema.index({ requestedBy: 1 })
UpdateRequestSchema.index({ createdAt: -1 })
