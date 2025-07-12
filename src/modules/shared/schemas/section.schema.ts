import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type SectionDocument = Section & Document

@Schema({ _id: false })
export class SectionRelatedWork {
  @Prop({
    type: String,
    enum: ['Galgame', 'LightNovel'],
  })
  type: string

  @Prop({
    type: Types.ObjectId,
    refPath: 'relatedWork.type',
  })
  workId: Types.ObjectId
}

@Schema({ _id: false })
export class SectionCreator {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId

  @Prop({
    type: String,
    required: true,
  })
  name: string
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Section {
  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  id: string

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string

  @Prop({
    type: String,
  })
  description: string

  @Prop({
    type: Number,
    default: 0,
  })
  followCount: number

  @Prop({
    type: Number,
    default: 0,
  })
  useCount: number

  @Prop({ type: SectionRelatedWork })
  relatedWork: SectionRelatedWork

  @Prop({
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
  })
  slug: string

  @Prop({ type: String })
  cover: string

  @Prop({ type: String })
  icon: string

  @Prop({ type: String })
  color: string

  @Prop({
    type: String,
    enum: ['pending', 'published', 'rejected', 'deleted', 'draft'],
    default: 'published',
  })
  status: string

  @Prop({ type: SectionCreator })
  creator: SectionCreator

  createdAt: Date
  updatedAt: Date
}

export const SectionSchema = SchemaFactory.createForClass(Section)

// 热度虚拟字段
SectionSchema.virtual('hotness').get(function () {
  try {
    if (!this.createdAt || !this.useCount || !this.followCount) {
      return 0
    }

    const createdAtTime =
      this.createdAt instanceof Date ? this.createdAt.getTime() : new Date(this.createdAt).getTime()

    const hoursAge = (Date.now() - createdAtTime) / (1000 * 60 * 60)
    const useWeight = 6
    const followWeight = 4
    const timeDecayFactor = 1.8

    const baseScore = this.useCount * useWeight + this.followCount * followWeight
    const score = baseScore / Math.pow(hoursAge + 2, timeDecayFactor)

    return Math.round(score * 1000)
  } catch (error) {
    console.error('Error calculating section hotness:', error)
    return 0
  }
})
