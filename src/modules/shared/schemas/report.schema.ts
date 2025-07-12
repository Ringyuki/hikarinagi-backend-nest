import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ReportDocument = Report & Document

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Report {
  @Prop({
    type: String,
    required: true,
    enum: ['User', 'Post', 'Article', 'Comment', 'Rate'],
  })
  reportedContentType: string

  @Prop({
    type: Types.ObjectId,
    required: true,
    refPath: 'reportedContentType',
  })
  reportedContentId: Types.ObjectId

  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: 'User',
  })
  reportedBy: Types.ObjectId

  @Prop({
    type: String,
    required: true,
    enum: ['Spam', 'Inappropriate', 'Harassment', 'Violence', 'Scam', 'Discrimination', 'Other'],
  })
  reason: string

  @Prop({
    type: String,
    maxlength: 500,
    required: function () {
      return this.reason === 'Other'
    },
  })
  description: string

  @Prop({
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Resolved', 'Rejected'],
  })
  status: string

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  processedBy: Types.ObjectId

  @Prop({
    type: String,
    maxlength: 500,
    default: null,
  })
  processComments: string

  @Prop({
    type: Date,
    default: null,
  })
  processedAt: Date
}

export const ReportSchema = SchemaFactory.createForClass(Report)
