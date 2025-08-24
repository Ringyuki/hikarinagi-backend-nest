import { Prop, Schema } from '@nestjs/mongoose'
import { BaseDisplayItem } from './base-display-item.schema'
import { Document } from 'mongoose'

export type FriendLinkItemDocument = FriendLinkItem & Document
export type FriendLinksSettingsDocument = FriendLinksSettings & Document

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
