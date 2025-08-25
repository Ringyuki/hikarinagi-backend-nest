import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import {
  AnnouncementItem,
  AnnouncementSettings,
  CarouselItem,
  CarouselSettings,
  FriendLinkItem,
  FriendLinksSettings,
  NewsItem,
  NewsSettings,
  AdvertisementItem,
  AdvertisementSettings,
} from './components'
import { UIComponentType } from '../enums/UIComponentType.enum'

export type UIComponentDocument = UIComponent & Document

@Schema({
  timestamps: true,
  versionKey: false,
  discriminatorKey: 'type',
  toJSON: {
    transform: (_, ret, options) => {
      if (!options.include_id) {
        delete ret._id
      }
      delete ret.__v
    },
  },
})
export class UIComponent {
  @Prop({
    type: String,
    required: true,
    enum: UIComponentType,
  })
  type: UIComponentType

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

// 组件子类
const AnnouncementItemSchema = SchemaFactory.createForClass(AnnouncementItem)
const AnnouncementSettingsSchema = SchemaFactory.createForClass(AnnouncementSettings)
const CarouselItemSchema = SchemaFactory.createForClass(CarouselItem)
const CarouselSettingsSchema = SchemaFactory.createForClass(CarouselSettings)
const FriendLinkItemSchema = SchemaFactory.createForClass(FriendLinkItem)
const FriendLinksSettingsSchema = SchemaFactory.createForClass(FriendLinksSettings)
const NewsItemSchema = SchemaFactory.createForClass(NewsItem)
const NewsSettingsSchema = SchemaFactory.createForClass(NewsSettings)
const AdvertisementItemSchema = SchemaFactory.createForClass(AdvertisementItem)
const AdvertisementSettingsSchema = SchemaFactory.createForClass(AdvertisementSettings)

@Schema({ _id: false })
export class AnnouncementComponent {
  @Prop({ type: [AnnouncementItemSchema] })
  items: AnnouncementItem[]

  @Prop({ type: AnnouncementSettingsSchema })
  settings: AnnouncementSettings
}
UIComponentSchema.discriminator('announcement', SchemaFactory.createForClass(AnnouncementComponent))

@Schema({ _id: false })
export class CarouselComponent {
  @Prop({ type: [CarouselItemSchema] })
  items: CarouselItem[]

  @Prop({ type: CarouselSettingsSchema })
  settings: CarouselSettings
}
UIComponentSchema.discriminator('carousel', SchemaFactory.createForClass(CarouselComponent))

@Schema({ _id: false })
export class FriendLinksComponent {
  @Prop({ type: [FriendLinkItemSchema] })
  items: FriendLinkItem[]

  @Prop({ type: FriendLinksSettingsSchema })
  settings: FriendLinksSettings
}
UIComponentSchema.discriminator('friend-links', SchemaFactory.createForClass(FriendLinksComponent))

@Schema({ _id: false })
export class NewsComponent {
  @Prop({ type: [NewsItemSchema] })
  items: NewsItem[]

  @Prop({ type: NewsSettingsSchema })
  settings: NewsSettings
}
UIComponentSchema.discriminator('news', SchemaFactory.createForClass(NewsComponent))

@Schema({ _id: false })
export class AdvertisementComponent {
  @Prop({ type: [AdvertisementItemSchema] })
  items: AdvertisementItem[]

  @Prop({ type: AdvertisementSettingsSchema })
  settings: AdvertisementSettings
}
UIComponentSchema.discriminator(
  'advertisement',
  SchemaFactory.createForClass(AdvertisementComponent),
)

UIComponentSchema.index({ type: 1, page: 1, position: 1, section: 1 })
