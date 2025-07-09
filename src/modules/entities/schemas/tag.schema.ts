import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type TagDocument = Tag & Document

@Schema()
export class Creator {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId

  @Prop({ type: String, required: true })
  name: string
}

@Schema({ timestamps: true })
export class Tag {
  @Prop({
    type: Number,
    required: true,
    unique: true,
  })
  id: number

  @Prop({
    type: String,
    required: true,
  })
  name: string

  @Prop({ type: [String] })
  aliases: string[]

  @Prop({ type: String })
  description: string

  @Prop({
    type: String,
    enum: ['pending', 'published', 'rejected', 'deleted', 'draft'],
    default: 'published',
  })
  status: string

  @Prop({ type: Creator, required: true })
  creator: Creator
}

export const TagSchema = SchemaFactory.createForClass(Tag)
