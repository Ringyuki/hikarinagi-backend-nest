import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import * as bcrypt from 'bcrypt'

export type UserDocument = User & Document

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
  username: string

  @Prop({ required: true, unique: true })
  email: string

  @Prop({ required: true })
  password: string

  @Prop({ default: 'user' })
  role: string

  @Prop({ default: false })
  isVerified: boolean

  @Prop()
  avatar?: string

  @Prop()
  bio?: string

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password)
  }
}

export const UserSchema = SchemaFactory.createForClass(User)

// 添加中间件以在保存前哈希密码
UserSchema.pre('save', async function (next) {
  const user = this as UserDocument

  // 仅在密码被修改时执行哈希
  if (!user.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(user.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})
