import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ProducerDocument = Producer & Document

@Schema()
export class Work {
  @Prop({
    type: String,
    required: true,
    enum: ['Galgame', 'LightNovel'],
  })
  workType: string

  @Prop({
    type: Types.ObjectId,
    refPath: 'works.workType',
  })
  work: Types.ObjectId
}

@Schema()
export class Label {
  @Prop({ type: String, required: true })
  key: string

  @Prop({ type: String, required: true, default: '未知' })
  value: string
}

@Schema()
export class Creator {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId

  @Prop({ type: String, required: true })
  name: string
}

@Schema({ timestamps: true })
export class Producer {
  @Prop({
    type: Number,
    required: true,
    unique: true,
  })
  id: number

  @Prop({
    type: String,
    required: true,
  })
  name: string

  @Prop({ type: [String] })
  aliases: string[]

  @Prop({ type: String })
  intro: string

  @Prop({ type: String })
  transIntro: string

  @Prop({ type: [String] })
  type: string[]

  @Prop({
    type: String,
    required: true,
  })
  country: string

  @Prop({ type: String })
  established: string

  @Prop({ type: String })
  logo: string

  @Prop({ type: [Work] })
  works: Work[]

  @Prop({ type: [Label] })
  labels: Label[]

  @Prop({
    type: String,
    enum: ['pending', 'published', 'rejected', 'deleted', 'draft'],
    default: 'published',
  })
  status: string

  @Prop({ type: Creator, required: true })
  creator: Creator
}

export const ProducerSchema = SchemaFactory.createForClass(Producer)
