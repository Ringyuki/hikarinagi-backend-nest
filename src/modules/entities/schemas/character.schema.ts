import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { CharacterToObjectOptions } from '../../../types/mongoose-extensions'

export type CharacterDocument = Character & Document

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
export class Relation {
  @Prop({
    type: Types.ObjectId,
    ref: 'Character',
  })
  character: Types.ObjectId

  @Prop({
    type: String,
    required: true,
  })
  relation: string
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
    transform: (_, ret, options: CharacterToObjectOptions) => {
      if (options.notInclude_id) {
        delete ret._id
      }
      delete ret.createdAt
      delete ret.updatedAt
      delete ret.__v
      return ret
    },
  },
})
export class Character {
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

  @Prop({ type: String })
  transName: string

  @Prop({ type: [String] })
  aliases: string[]

  @Prop({
    type: String,
    required: false,
    default: '暂无',
  })
  intro: string

  @Prop({ type: String })
  transIntro: string

  @Prop({ type: String })
  image: string

  @Prop({ type: [Work] })
  works: Work[]

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Person' }],
  })
  actors: Types.ObjectId[]

  @Prop({ type: [Label] })
  labels: Label[]

  @Prop({ type: [Relation] })
  relations: Relation[]

  @Prop({
    type: String,
    enum: ['pending', 'published', 'rejected', 'deleted', 'draft'],
    default: 'published',
  })
  status: string

  @Prop({ type: Creator, required: true })
  creator: Creator
}

export const CharacterSchema = SchemaFactory.createForClass(Character)

CharacterSchema.pre('save', function () {
  const existingKeys = new Set(this.labels.map(label => label.key))

  const defaultLabels = ['性别', '生日']
  defaultLabels.forEach(key => {
    if (!existingKeys.has(key)) {
      this.labels.push({ key, value: '未知' })
    }
  })
})
