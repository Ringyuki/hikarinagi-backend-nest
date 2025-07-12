import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type FavoriteDocument = Favorite & Document

@Schema({
  timestamps: false,
  versionKey: false,
})
export class Favorite {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId

  @Prop({
    type: String,
    enum: ['Galgame', 'LightNovel', 'Article', 'Post', 'Section', 'Topic'],
    required: true,
  })
  itemType: string

  @Prop({
    type: Types.ObjectId,
    required: true,
    refPath: 'itemType',
  })
  itemId: Types.ObjectId

  @Prop({
    type: String,
    default: '',
  })
  note: string

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt: Date
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite)

// 复合唯一索引
FavoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true })
