import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ReadingProgressDocument = ReadingProgress & Document

@Schema({ _id: false })
export class ReadingProgressCfi {
  @Prop({
    type: String,
    required: true,
  })
  start: string

  @Prop({
    type: String,
    required: true,
  })
  end: string
}

@Schema({ _id: false })
export class ReadingProgressCurrentChapter {
  @Prop({ type: Number })
  index: number

  @Prop({ type: String })
  href: string

  @Prop({ type: String })
  title: string
}

@Schema({ _id: false })
export class ReadingProgressInfo {
  @Prop({
    type: Number,
    default: 0,
  })
  percentage: number

  @Prop({ type: ReadingProgressCfi })
  cfi: ReadingProgressCfi

  @Prop({ type: ReadingProgressCurrentChapter })
  currentChapter: ReadingProgressCurrentChapter

  @Prop({
    type: Date,
    default: Date.now,
  })
  lastRead: Date
}

@Schema({ _id: false })
export class ReadingProgressBookmark {
  @Prop({ type: ReadingProgressCfi })
  cfi: ReadingProgressCfi

  @Prop({
    index: Number,
    title: String,
  })
  chapter: {
    index: number
    title: string
  }

  @Prop({ type: String })
  text: string

  @Prop({ type: String })
  note: string

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt: Date
}

@Schema({ _id: false })
export class ReadingProgressAnnotation {
  @Prop({ type: ReadingProgressCfi })
  cfi: ReadingProgressCfi

  @Prop({
    type: String,
    default: '#ffeb3b',
  })
  highlightColor: string

  @Prop({ type: String })
  text: string

  @Prop({ type: String })
  note: string

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt: Date
}

@Schema({ _id: false })
export class ReadingProgressStats {
  @Prop({
    type: Number,
    default: 0,
  })
  totalBookmarks: number

  @Prop({
    type: Number,
    default: 0,
  })
  totalAnnotations: number
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ReadingProgress {
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
  volumeId: string

  @Prop({
    type: String,
    required: true,
  })
  novelId: string

  @Prop({ type: ReadingProgressInfo })
  progress: ReadingProgressInfo

  @Prop([ReadingProgressBookmark])
  bookmarks: ReadingProgressBookmark[]

  @Prop([ReadingProgressAnnotation])
  annotations: ReadingProgressAnnotation[]

  @Prop({ type: ReadingProgressStats })
  stats: ReadingProgressStats
}

export const ReadingProgressSchema = SchemaFactory.createForClass(ReadingProgress)

// 索引
ReadingProgressSchema.index({ userId: 1, volumeId: 1 }, { unique: true })
ReadingProgressSchema.index({ userId: 1, novelId: 1 })
ReadingProgressSchema.index({ 'progress.lastRead': -1 })
ReadingProgressSchema.index({ 'bookmarks.createdAt': -1 })
ReadingProgressSchema.index({ 'annotations.createdAt': -1 })
