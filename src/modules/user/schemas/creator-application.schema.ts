import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type CreatorApplicationDocument = CreatorApplication & Document

@Schema({
  timestamps: true,
  versionKey: false,
})
export class CreatorApplication {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  requestedBy: Types.ObjectId

  @Prop({
    type: String,
    required: true,
    maxlength: 500,
  })
  reason: string

  @Prop({
    type: String,
    required: true,
    maxlength: 100,
  })
  hp: string

  @Prop([
    {
      type: String,
    },
  ])
  images: string[]

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: string

  @Prop({
    type: String,
    maxlength: 500,
    default: null,
  })
  rejectionReason: string
}

export const CreatorApplicationSchema = SchemaFactory.createForClass(CreatorApplication)
