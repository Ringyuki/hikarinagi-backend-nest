import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import * as bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

export type UserDocument = User &
  Document & {
    comparePassword(password: string): Promise<boolean>
  }

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret.password
      delete ret.__v
      return ret
    },
  },
})
export class User {
  @Prop({ required: true, unique: true })
  userId: string

  @Prop({ required: true, unique: true })
  uuid: string

  @Prop({ required: true, unique: true })
  name: string

  @Prop({ required: true, unique: true })
  email: string

  @Prop({ required: true })
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

  @Prop({ default: 'active', enum: ['active', 'inactive', 'banned'] })
  status: string
}

export const UserSchema = SchemaFactory.createForClass(User)

// 添加 comparePassword 方法到 schema
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password)
}

// 添加中间件以在保存前哈希密码
UserSchema.pre('save', async function (next) {
  // 如果用户是新用户，则生成 uuid
  if (!this.uuid) {
    this.uuid = uuidv4()
  }
  // 如果refresh token 过期，则删除
  if (this.hikariRefreshToken) {
    this.hikariRefreshToken = this.hikariRefreshToken.filter(token => token.expiresAt > new Date())
  }

  // 仅在密码被修改时执行哈希
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})
