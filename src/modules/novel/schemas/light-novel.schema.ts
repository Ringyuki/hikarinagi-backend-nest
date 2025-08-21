import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { LightNovelToObjectOptions } from '../../../types/mongoose-extensions'

export type LightNovelDocument = LightNovel & Document

@Schema({ _id: false })
export class LightNovelIllustrator {
  @Prop({
    type: Types.ObjectId,
    ref: 'Person',
  })
  illustrator: Types.ObjectId

  @Prop({
    type: String,
    default: '',
  })
  note: string
}

@Schema({ _id: false })
export class LightNovelPublisher {
  @Prop({
    type: Types.ObjectId,
    ref: 'Producer',
  })
  publisher: Types.ObjectId

  @Prop({
    type: String,
    default: '',
  })
  note: string
}

@Schema({ _id: false })
export class LightNovelCharacter {
  @Prop({
    type: Types.ObjectId,
    ref: 'Character',
  })
  character: Types.ObjectId

  @Prop({
    type: String,
    required: true,
  })
  role: string
}

@Schema({ _id: false })
export class LightNovelTag {
  @Prop({
    type: Types.ObjectId,
    ref: 'Tag',
  })
  tag: Types.ObjectId

  @Prop({
    type: Number,
    default: 0,
  })
  likes: number
}

@Schema({ _id: false })
export class LightNovelSeries {
  @Prop({ type: Number })
  totalVolumes: number

  @Prop([
    {
      type: Types.ObjectId,
      ref: 'LightNovelVolume',
    },
  ])
  volumes: Types.ObjectId[]
}

@Schema({ _id: false })
export class LightNovelCreator {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId

  @Prop({ type: String })
  name: string
}

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: (_, ret, options: LightNovelToObjectOptions) => {
      if (options.transformToUpdateRequestFormat) {
        if (ret.author) {
          ret.author = {
            _id: ret.author._id,
            name: ret.author.name,
            image: ret.author.image,
          }
        }
        if (ret.illustrators && Array.isArray(ret.illustrators)) {
          ret.illustrators = ret.illustrators.map(i => ({
            _id: i.illustrator?._id || i.illustrator,
            name: i.illustrator?.name || '',
            image: i.illustrator?.image || '',
            note: i.note || '',
          }))
        }
        if (ret.publishers) {
          const publishersArray = Array.isArray(ret.publishers) ? ret.publishers : [ret.publishers]
          ret.publishers = publishersArray.map(publisher => ({
            _id: publisher.publisher?._id || publisher.publisher,
            name: publisher.publisher?.name || '',
            logo: publisher.publisher?.logo || '',
            note: publisher.note || '',
          }))
        }
        if (ret.bunko) {
          ret.bunko = {
            _id: ret.bunko._id,
            name: ret.bunko.name,
            logo: ret.bunko.logo,
          }
        }
        if (ret.characters && Array.isArray(ret.characters)) {
          ret.characters = ret.characters.map(c => ({
            _id: c.character?._id || c.character,
            name: c.character?.name || '',
            image: c.character?.image || '',
            role: c.role || '',
          }))
        }
        if (ret.tags && Array.isArray(ret.tags)) {
          ret.tags = ret.tags.map(t => ({
            _id: t.tag?._id || t.tag,
            name: t.tag?.name || '',
          }))
        }
        delete ret.__v
        delete ret._id
        delete ret.views
        delete ret.createdAt
        delete ret.updatedAt
        return ret
      }
      delete ret.__v
      return ret
    },
  },
})
export class LightNovel {
  @Prop({
    type: Number,
    required: true,
    unique: true,
  })
  novelId: number

  @Prop({
    type: Number,
    unique: true,
  })
  bangumiBookId: number

  @Prop({
    type: String,
    required: true,
  })
  name: string

  @Prop({ type: String })
  name_cn: string

  @Prop([String])
  otherNames: string[]

  @Prop({
    type: String,
    default: '',
  })
  cover: string

  @Prop({
    type: Types.ObjectId,
    ref: 'Person',
  })
  author: Types.ObjectId

  @Prop([LightNovelIllustrator])
  illustrators: LightNovelIllustrator[]

  @Prop([LightNovelPublisher])
  publishers: LightNovelPublisher[]

  @Prop({
    type: Types.ObjectId,
    ref: 'Producer',
  })
  bunko: Types.ObjectId

  @Prop([LightNovelCharacter])
  characters: LightNovelCharacter[]

  @Prop({
    type: String,
    enum: ['SERIALIZING', 'FINISHED', 'PAUSED', 'ABANDONED'],
    default: 'SERIALIZING',
  })
  novelStatus: string

  @Prop({ type: LightNovelSeries })
  series: LightNovelSeries

  @Prop([LightNovelTag])
  tags: LightNovelTag[]

  @Prop({ type: String })
  summary: string

  @Prop({ type: String })
  summary_cn: string

  @Prop({
    type: Boolean,
    default: false,
  })
  nsfw: boolean

  @Prop({
    type: Boolean,
    default: false,
  })
  locked: boolean

  @Prop({
    type: String,
    enum: ['pending', 'published', 'rejected', 'deleted', 'draft'],
    default: 'published',
  })
  status: string

  @Prop({ type: LightNovelCreator })
  creator: LightNovelCreator

  @Prop({
    type: Number,
    default: 0,
  })
  views: number

  @Prop({
    type: Number,
    default: 0,
  })
  readTimes: number

  @Prop({
    type: Number,
    default: 0,
  })
  downloadTimes: number
}

export const LightNovelSchema = SchemaFactory.createForClass(LightNovel)
