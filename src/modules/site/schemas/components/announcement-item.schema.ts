import { Prop, Schema } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type AnnouncementItemDocument = AnnouncementItem & Document
export type AnnouncementSettingsDocument = AnnouncementSettings & Document

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
