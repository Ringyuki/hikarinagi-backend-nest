import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type EmojiSetDocument = EmojiSet & Document

@Schema({
  timestamps: true,
  versionKey: false,
})
export class EmojiSet {
  @Prop({
    type: Number,
    required: true,
    unique: true,
  })
  id: number

  @Prop({
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 20,
  })
  name: string

  @Prop([
    {
      type: Types.ObjectId,
      ref: 'Emoji',
    },
  ])
  emojis: Types.ObjectId[]

  @Prop({
    type: String,
    enum: ['pending', 'published', 'rejected', 'deleted'],
    default: 'published',
  })
  status: string
}

export const EmojiSetSchema = SchemaFactory.createForClass(EmojiSet)
