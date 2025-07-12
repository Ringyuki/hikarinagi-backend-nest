import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type SectionInteractionDocument = SectionInteraction & Document

@Schema({
  timestamps: false,
  versionKey: false,
})
export class SectionInteraction {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId

  @Prop({
    type: Types.ObjectId,
    ref: 'Section',
    required: true,
  })
  section: Types.ObjectId

  @Prop({
    type: String,
    enum: ['follow'],
    required: true,
  })
  type: string
}

export const SectionInteractionSchema = SchemaFactory.createForClass(SectionInteraction)

// 复合唯一索引
SectionInteractionSchema.index({ user: 1, section: 1 }, { unique: true })
