import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ _id: false })
export class RelatedWork {
  @Prop({
    type: String,
    enum: ['Galgame', 'LightNovel'],
  })
  type: string

  @Prop({
    type: Types.ObjectId,
    refPath: 'relatedWorks.type',
  })
  workId: Types.ObjectId
}

@Schema({ _id: false })
export class PostCreator {
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
export class Post {
  @Prop({
    type: Number,
    required: true,
    unique: true,
  })
  id: number

  @Prop({
    type: String,
    required: false,
    default: '',
    trim: true,
    maxlength: 100,
  })
  title: string

  @Prop([
    {
      type: String,
      default: '',
    },
  ])
  covers: string[]

  @Prop({
    type: String,
    required: true,
    maxlength: 3000,
  })
  content: string

  @Prop([
    {
      type: Types.ObjectId,
      ref: 'Section',
    },
  ])
  sections: Types.ObjectId[]

  @Prop([
    {
      type: Types.ObjectId,
      ref: 'Topic',
    },
  ])
  topics: Types.ObjectId[]

  @Prop({ type: [RelatedWork] })
  relatedWorks: RelatedWork[]

  @Prop({
    type: Boolean,
    default: false,
  })
  isNews: boolean

  @Prop({
    type: String,
    enum: ['Galgame', 'LightNovel'],
    default: null,
  })
  newsType: string

  @Prop({
    type: Number,
    default: 0,
  })
  viewCount: number

  @Prop({
    type: Number,
    default: 0,
  })
  likeCount: number

  @Prop({
    type: String,
    enum: ['pending', 'published', 'rejected', 'deleted', 'draft'],
    default: 'published',
  })
  status: string

  @Prop({
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  })
  visible: string

  @Prop({
    type: String,
    enum: ['allow', 'disallow'],
  })
  allowComment: string

  @Prop({ type: PostCreator })
  creator: PostCreator
}

export type PostDocument = Post & Document
export const PostSchema = SchemaFactory.createForClass(Post)

// 热度虚拟字段
PostSchema.virtual('hotness').get(function (this: PostDocument) {
  const hoursAge = (Date.now() - (this as any).createdAt.getTime()) / (1000 * 60 * 60)
  const viewWeight = 2
  const likeWeight = 6
  const timeDecayFactor = 1.8

  const baseScore = this.viewCount * viewWeight + this.likeCount * likeWeight
  const score = baseScore / Math.pow(hoursAge + 2, timeDecayFactor)

  return Math.round(score * 1000)
})
