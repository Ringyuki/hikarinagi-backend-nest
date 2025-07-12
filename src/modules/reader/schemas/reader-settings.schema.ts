import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ReaderSettingsDocument = ReaderSettings & Document

@Schema({ _id: false })
export class ReaderSettingsTheme {
  @Prop({
    type: Number,
    default: 0,
  })
  themeIndex: number

  @Prop({
    type: String,
    default: '#ffffff',
  })
  backgroundColor: string

  @Prop({
    type: String,
    default: '#000000',
  })
  textColor: string

  @Prop({
    type: Number,
    default: 20,
  })
  fontSize: number

  @Prop({
    type: String,
    default: 'system-ui',
  })
  fontFamily: string

  @Prop({
    type: Number,
    default: 1.5,
  })
  lineHeight: number

  @Prop({
    type: Number,
    default: 20,
  })
  margins: number
}

@Schema({ _id: false })
export class ReaderSettingsPreferences {
  @Prop({
    type: String,
    enum: ['scroll', 'pagination'],
    default: 'pagination',
  })
  scrollMode: string

  @Prop({
    type: Boolean,
    default: true,
  })
  keepScreenOn: boolean

  @Prop({
    type: Boolean,
    default: true,
  })
  showProgress: boolean

  @Prop({
    type: Boolean,
    default: false,
  })
  showTime: boolean
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ReaderSettings {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: Types.ObjectId

  @Prop({ type: ReaderSettingsTheme })
  theme: ReaderSettingsTheme

  @Prop({ type: ReaderSettingsPreferences })
  preferences: ReaderSettingsPreferences
}

export const ReaderSettingsSchema = SchemaFactory.createForClass(ReaderSettings)
