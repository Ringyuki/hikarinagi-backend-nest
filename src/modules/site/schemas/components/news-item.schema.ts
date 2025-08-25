import { Prop, Schema } from '@nestjs/mongoose'
import { BaseDisplayItem } from './base-display-item.schema'
import { Types, Document } from 'mongoose'

export type NewsItemDocument = NewsItem & Document
export type NewsSettingsDocument = NewsSettings & Document

@Schema({ _id: false })
export class NewsItem extends BaseDisplayItem {
  @Prop({
    type: String,
    enum: ['Galgame', 'LightNovel'],
    required: true,
  })
  newsType: string

  @Prop({
    type: String,
    enum: ['Article', 'Post'],
    required: true,
  })
  contentType: string

  @Prop({
    type: Types.ObjectId,
    refPath: 'contentType',
  })
  contentId: Types.ObjectId

  @Prop({ type: String })
  customTitle: string
}

@Schema({ _id: false })
export class NewsSettings {
  @Prop({
    type: Number,
    default: 6,
  })
  maxDisplay: number

  @Prop({
    type: Boolean,
    default: true,
  })
  showThumbnail: boolean

  @Prop({
    type: Boolean,
    default: true,
  })
  showDate: boolean

  @Prop({
    type: Boolean,
    default: true,
  })
  showAuthor: boolean
}
