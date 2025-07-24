import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Comment, CommentDocument } from '../schemas/comment.schema'
import { BadRequestException } from '@nestjs/common'

@Injectable()
export class CommentService {
  constructor(@InjectModel(Comment.name) private commentModel: Model<CommentDocument>) {}

  async pinComment(id: string): Promise<Comment> {
    const comment = await this.commentModel.findById(id)

    if (!comment) {
      throw new NotFoundException('评论不存在')
    }

    if (comment.parentId || comment.replyToCommentId) {
      throw new BadRequestException('不能置顶回复')
    }

    comment.isPinned = !comment.isPinned
    await comment.save()
    return comment
  }
}
