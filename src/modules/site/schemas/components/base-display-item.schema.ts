import { Prop, Schema } from '@nestjs/mongoose'

@Schema({ _id: false })
export class BaseDisplayItem {
  @Prop({ type: String })
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
