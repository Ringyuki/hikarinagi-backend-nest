import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type UIComponentDocument = UIComponent & Document

@Schema({ _id: false })
export class BaseDisplayItem {
  @Prop({
    type: String,
    required: true,
  })
  title: string

  @Prop({ type: String })
  description: string

  @Prop({ type: String })
  image: string

  @Prop({
    type: String,
    required: true,
  })
  link: string

  @Prop({
    type: Number,
    default: 0,
  })
  order: number

  @Prop({ type: Date })
  startDate: Date

  @Prop({ type: Date })
  endDate: Date

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean
}

@Schema({ _id: false })
export class CarouselItem extends BaseDisplayItem {}

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
export class AnnouncementItem {
  @Prop({
    type: String,
    required: true,
  })
  content: string

  @Prop({ type: String })
  link: string

  @Prop({
    type: Number,
    default: 0,
  })
  order: number

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean

  @Prop({ type: Date })
  startDate: Date

  @Prop({ type: Date })
  endDate: Date
}

@Schema({ _id: false })
export class FriendLinkItem extends BaseDisplayItem {
  @Prop({
    type: String,
    required: true,
  })
  siteName: string

  @Prop({
    type: String,
    required: true,
  })
  siteUrl: string

  @Prop({ type: String })
  logoUrl: string

  @Prop({ type: String })
  screenshotUrl: string

  @Prop({ type: String })
  siteDescription: string

  @Prop({ type: String })
  contactEmail: string

  @Prop({
    type: String,
    enum: ['acgn', 'tech', 'others'],
    default: 'acgn',
  })
  category: string

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  })
  priority: number

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  })
  status: string

  @Prop({
    type: Date,
    default: Date.now,
  })
  applicationDate: Date

  @Prop({ type: Date })
  approvedDate: Date

  @Prop({ type: Date })
  lastChecked: Date

  @Prop({
    type: Boolean,
    default: false,
  })
  reciprocalLink: boolean

  @Prop({
    type: Boolean,
    default: false,
  })
  reciprocalLinkChecked: boolean
}

@Schema({ _id: false })
export class CarouselSettings {
  @Prop({
    type: Boolean,
    default: true,
  })
  autoplay: boolean

  @Prop({
    type: Number,
    default: 5000,
  })
  interval: number

  @Prop({
    type: Boolean,
    default: true,
  })
  showArrows: boolean

  @Prop({
    type: Boolean,
    default: true,
  })
  showPagination: boolean

  @Prop({
    type: Boolean,
    default: false,
  })
  showCount: boolean
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

@Schema({ _id: false })
export class AnnouncementSettings {
  @Prop({
    type: Boolean,
    default: true,
  })
  autoplay: boolean

  @Prop({
    type: Number,
    default: 5000,
  })
  interval: number

  @Prop({
    type: Number,
    default: 3,
  })
  maxDisplay: number
}

@Schema({ _id: false })
export class FriendLinksSettings {
  @Prop({
    type: Number,
    default: 20,
  })
  maxDisplay: number

  @Prop({
    type: String,
    enum: ['grid', 'list', 'carousel'],
    default: 'grid',
  })
  displayStyle: string

  @Prop({
    type: Number,
    default: 4,
  })
  itemsPerRow: number

  @Prop({
    type: Boolean,
    default: true,
  })
  showLogo: boolean

  @Prop({
    type: Boolean,
    default: true,
  })
  showDescription: boolean

  @Prop({
    type: String,
    enum: ['_blank', '_self'],
    default: '_blank',
  })
  linkTarget: string

  @Prop({
    type: Boolean,
    default: false,
  })
  randomOrder: boolean
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class UIComponent {
  @Prop({
    type: String,
    required: true,
    enum: ['carousel', 'news', 'announcement', 'friend-links'],
  })
  type: string

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  page: string

  @Prop({ type: String })
  position: string

  @Prop({ type: String })
  note: string

  @Prop({ type: Object })
  settings: object

  @Prop([Object])
  items: object[]

  @Prop({
    type: String,
  })
  section: string

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  createdBy: Types.ObjectId
}

export const UIComponentSchema = SchemaFactory.createForClass(UIComponent)
