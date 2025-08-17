import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import * as bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { UserToObjectOptions } from '../../../types/mongoose-extensions'

export type UserDocument = User &
  Document & {
    comparePassword(password: string): Promise<boolean>
  }

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret, options: UserToObjectOptions) => {
      if (!options.includeEmail) {
        delete ret.email
      }
      if (options.includeStatus) {
        ret.followersCount = ret.followers.length
        ret.followingCount = ret.following.length
      }
      if (options.notInclude_id) {
        delete ret._id
      }
      delete ret.password
      delete ret.isVerified
      delete ret.createdAt
      delete ret.updatedAt
      delete ret.hikariRefreshToken
      delete ret.followers
      delete ret.following
      delete ret.__v
      delete ret.uuid
      return ret
    },
  },
})
export class User {
  @Prop({
    required: function () {
      return this.isVerified
    },
    unique: true,
  })
  userId: string

  @Prop({
    required: function () {
      return this.userId
    },
    unique: true,
  })
  uuid: string

  @Prop({
    required: function () {
      return this.name
    },
    unique: true,
  })
  name: string

  @Prop({ required: true, unique: true })
  email: string

  @Prop({
    required: function () {
      return this.password
    },
  })
  password: string

  @Prop({ default: false })
  isVerified: boolean

  @Prop()
  avatar?: string

  @Prop()
  bio?: string

  @Prop()
  signature?: string

  @Prop()
  headCover?: string

  @Prop({ default: 0, type: Number })
  hikariPoint: number

  @Prop({ required: true, default: 'user' })
  hikariUserGroup: string

  @Prop({ default: [] })
  hikariRefreshToken?: {
    token: string
    deviceInfo: string
    createdAt: Date
    expiresAt: Date
  }[]

  @Prop({ default: [], ref: 'User' })
  followers?: mongoose.Types.ObjectId[]

  @Prop({ default: [], ref: 'User' })
  following?: mongoose.Types.ObjectId[]

  @Prop({ ref: 'UserSetting' })
  setting: mongoose.Types.ObjectId

  @Prop({ default: 'active', enum: ['active', 'inactive', 'banned'] })
  status: string
}

export const UserSchema = SchemaFactory.createForClass(User)

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password)
}

UserSchema.pre('validate', function () {
  if (!this.uuid) this.uuid = uuidv4()
  if (!this.hikariPoint) this.hikariPoint = 0
})

UserSchema.pre('save', async function () {
  // 如果refresh token 过期，则删除
  if (this.hikariRefreshToken) {
    this.hikariRefreshToken = this.hikariRefreshToken.filter(token => token.expiresAt > new Date())
  }

  // 仅在密码被修改时执行哈希
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})
