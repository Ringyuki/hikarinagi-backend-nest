import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type TopicInteractionDocument = TopicInteraction & Document

@Schema({
  timestamps: false,
  versionKey: false,
})
export class TopicInteraction {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId

  @Prop({
    type: Types.ObjectId,
    ref: 'Topic',
    required: true,
  })
  topic: Types.ObjectId

  @Prop({
    type: String,
    enum: ['follow'],
    required: true,
  })
  type: string
}

export const TopicInteractionSchema = SchemaFactory.createForClass(TopicInteraction)

// 复合唯一索引
TopicInteractionSchema.index({ user: 1, topic: 1 }, { unique: true })
