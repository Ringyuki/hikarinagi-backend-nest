import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ReadingStatsDocument = ReadingStats & Document

@Schema({ _id: false })
export class ReadingStatsDailyStats {
  @Prop({
    type: Date,
    required: true,
  })
  date: Date

  @Prop({
    type: Number,
    default: 0,
  })
  totalTime: number

  @Prop({
    type: Number,
    default: 0,
  })
  sessionCount: number

  @Prop({
    start: Number,
    end: Number,
  })
  progress: {
    start: number
    end: number
  }
}

@Schema({ _id: false })
export class ReadingStatsWeeklyStats {
  @Prop({ type: Date })
  weekStart: Date

  @Prop({ type: Number })
  totalTime: number

  @Prop({ type: Number })
  avgSessionTime: number

  @Prop({ type: Number })
  progressMade: number
}

@Schema({ _id: false })
export class ReadingStatsMonthlyStats {
  @Prop({ type: Date })
  monthStart: Date

  @Prop({ type: Number })
  totalTime: number

  @Prop({ type: Number })
  avgSessionTime: number

  @Prop({ type: Number })
  progressMade: number
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ReadingStats {
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
    type: Number,
    default: 0,
  })
  totalReadTime: number

  @Prop({
    type: Number,
    default: 0,
  })
  sessionsCount: number

  @Prop([ReadingStatsDailyStats])
  dailyStats: ReadingStatsDailyStats[]

  @Prop([ReadingStatsWeeklyStats])
  weeklyStats: ReadingStatsWeeklyStats[]

  @Prop([ReadingStatsMonthlyStats])
  monthlyStats: ReadingStatsMonthlyStats[]
}

export const ReadingStatsSchema = SchemaFactory.createForClass(ReadingStats)

// 索引
ReadingStatsSchema.index({ userId: 1, volumeId: 1 }, { unique: true })
ReadingStatsSchema.index({ 'dailyStats.date': -1 })
