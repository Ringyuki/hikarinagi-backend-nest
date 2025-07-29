import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { LightNovelToObjectOptions } from '../../../types/mongoose-extensions'

export type LightNovelVolumeDocument = LightNovelVolume & Document

@Schema({ _id: false })
export class LightNovelVolumePrice {
  @Prop({ type: Number })
  amount: number

  @Prop({ type: String })
  currency: string
}

@Schema({ _id: false })
export class LightNovelVolumeCreator {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId

  @Prop({ type: String })
  name: string
}

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: (_, ret, options: LightNovelToObjectOptions) => {
      if (options.transformToUpdateRequestFormat) {
        delete ret._id
        delete ret.__v
        delete ret.createdAt
        delete ret.updatedAt
        return ret
      }
      delete ret.__v
      return ret
    },
  },
})
export class LightNovelVolume {
  @Prop({
    type: Number,
    required: true,
    unique: true,
  })
  volumeId: number

  @Prop({
    type: Number,
    required: true,
    unique: true,
  })
  bangumiBookId: number

  @Prop({
    type: Types.ObjectId,
    ref: 'LightNovel',
    required: true,
  })
  seriesId: Types.ObjectId

  @Prop({
    type: String,
    enum: ['main', 'extra'],
    default: 'main',
  })
  volumeType: string

  @Prop({
    type: Number,
    sparse: true,
  })
  volumeNumber: number

  @Prop({
    type: String,
    default: '',
  })
  volumeExtraName: string

  @Prop({ type: String })
  name: string

  @Prop({ type: String })
  name_cn: string

  @Prop({
    type: String,
    default: '',
  })
  cover: string

  @Prop({ type: String })
  isbn: string

  @Prop({ type: LightNovelVolumePrice })
  price: LightNovelVolumePrice

  @Prop({ type: String })
  publicationDate: string

  @Prop({ type: Number })
  pages: number

  @Prop({ type: String })
  summary: string

  @Prop({ type: String })
  summary_cn: string

  @Prop({
    type: String,
    default: '单行本',
  })
  relation: string

  @Prop({
    type: String,
    enum: ['pending', 'published', 'rejected', 'deleted', 'draft'],
    default: 'published',
  })
  status: string

  @Prop({
    type: Boolean,
    default: false,
  })
  hasEpub: boolean

  @Prop({ type: LightNovelVolumeCreator })
  creator: LightNovelVolumeCreator

  @Prop({
    type: Number,
    default: 0,
  })
  views: number
}

export const LightNovelVolumeSchema = SchemaFactory.createForClass(LightNovelVolume)
