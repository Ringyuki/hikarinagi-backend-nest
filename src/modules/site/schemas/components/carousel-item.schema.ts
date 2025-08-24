import { Prop, Schema } from '@nestjs/mongoose'
import { BaseDisplayItem } from './base-display-item.schema'
import { Document } from 'mongoose'

export type CarouselItemDocument = CarouselItem & Document
export type CarouselSettingsDocument = CarouselSettings & Document

@Schema({ _id: false })
export class CarouselItem extends BaseDisplayItem {}

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
