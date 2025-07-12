import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type EmojiDocument = Emoji & Document

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Emoji {
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
    maxlength: 20,
  })
  name: string

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  src: string

  @Prop({
    type: Types.ObjectId,
    ref: 'EmojiSet',
    required: true,
  })
  emojiSet: Types.ObjectId
}

export const EmojiSchema = SchemaFactory.createForClass(Emoji)
