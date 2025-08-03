import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { ProducerToObjectOptions } from '../../../types/mongoose-extensions'

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

@Schema({ _id: false })
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

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret, options: ProducerToObjectOptions) => {
      if (options._transformToUpdateRequestFormat) {
        const _ret = {
          name: ret.name,
          country: ret.country,
          type: ret.type,
          aliases: ret.aliases,
          intro: ret.intro,
          transIntro: ret.transIntro,
          logo: ret.logo,
          labels: ret.labels.map(label => ({ key: label.key, value: label.value })),
          status: ret.status,
        }
        return _ret
      }
    },
  },
})
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
