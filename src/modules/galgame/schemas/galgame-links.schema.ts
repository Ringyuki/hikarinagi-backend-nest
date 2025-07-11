import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ _id: false })
export class LinkMeta {
  @Prop({
    type: String,
    enum: ['platform', 'type', 'size', 'language', 'password', 'unzip_password', 'download_type'],
  })
  key: string

  @Prop({
    type: String,
    required: true,
  })
  value: string
}

@Schema()
export class LinkDetail {
  _id?: Types.ObjectId

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  link: string

  @Prop({ type: [LinkMeta] })
  link_meta: LinkMeta[]

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  note: string

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt: Date
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret._id
      delete ret.__v
      return ret
    },
  },
})
export class GalgameLinks {
  @Prop({
    type: String,
    required: true,
    ref: 'Galgame',
  })
  galId: string

  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: 'User',
  })
  userId: Types.ObjectId

  @Prop({
    type: String,
    required: true,
    enum: ['official-link', 'download-link'],
  })
  linkType: string

  @Prop({ type: [LinkDetail] })
  linkDetail: LinkDetail[]
}

export type GalgameLinksDocument = GalgameLinks & Document
export const GalgameLinksSchema = SchemaFactory.createForClass(GalgameLinks)

// 复合索引确保每个用户的每种类型链接集合唯一
GalgameLinksSchema.index({ galId: 1, userId: 1, linkType: 1 }, { unique: true })
GalgameLinksSchema.pre('save', function (next) {
  for (const detail of this.linkDetail) {
    if (this.linkType === 'official-link') {
      const hasPlatform = detail.link_meta.some(meta => meta.key === 'platform')
      if (!hasPlatform) {
        return next(new Error('官方链接必须指定平台'))
      }
    } else {
      const hasType = detail.link_meta.some(meta => meta.key === 'type')
      const hasDownloadType = detail.link_meta.some(meta => meta.key === 'download_type')

      if (!hasType || !hasDownloadType) {
        return next(new Error('下载链接必须指定资源类型和下载类型'))
      }
    }
  }
  next()
})
