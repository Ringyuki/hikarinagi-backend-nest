import { Controller, Post, Param, UseGuards } from '@nestjs/common'
import { CommentService } from '../services/comment.service'
import { Roles } from '../../auth/decorators/roles.decorator'
import { HikariUserGroup } from '../../auth/enums/hikari-user-group.enum'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post(':id/pin')
  @Roles(HikariUserGroup.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async pinComment(@Param('id') id: string) {
    const comment = await this.commentService.pinComment(id)
    return {
      data: comment,
    }
  }
}
