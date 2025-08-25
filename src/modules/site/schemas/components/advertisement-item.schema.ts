import { Schema } from '@nestjs/mongoose'
import { BaseDisplayItem } from './base-display-item.schema'
import { Document } from 'mongoose'

export type AdvertisementItemDocument = AdvertisementItem & Document
export type AdvertisementSettingsDocument = AdvertisementSettings & Document

@Schema({ _id: false })
export class AdvertisementItem extends BaseDisplayItem {}

@Schema({ _id: false })
export class AdvertisementSettings {}
