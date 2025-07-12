import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type CommentInteractionDocument = CommentInteraction & Document

@Schema({
  timestamps: true,
  versionKey: false,
})
export class CommentInteraction {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId

  @Prop({
    type: Types.ObjectId,
    ref: 'Comment',
    required: true,
  })
  commentId: Types.ObjectId

  @Prop({
    type: String,
    enum: ['like', 'dislike'],
    required: true,
  })
  type: string
}

export const CommentInteractionSchema = SchemaFactory.createForClass(CommentInteraction)

// 复合唯一索引
CommentInteractionSchema.index({ userId: 1, commentId: 1 }, { unique: true })
