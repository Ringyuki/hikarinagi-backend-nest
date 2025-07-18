import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Req,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
import { GalgameLinsService } from '../services/galgame-lins.service'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { HikariUserGroup } from '../../auth/enums/hikari-user-group.enum'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { CreateGalgameLinkDto } from '../dto/create-galgame-link.dto'
import { UpdateGalgameLinkDto } from '../dto/update-galgame-link.dto'
import { DeleteGalgameLinkDto } from '../dto/delete-galgame-link.dto'

@Controller('galgame/links')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(HikariUserGroup.USER)
export class GalgameLinksController {
  constructor(private readonly galgameLinsService: GalgameLinsService) {}

  @Post()
  async createLink(@Body() body: CreateGalgameLinkDto, @Req() req: RequestWithUser) {
    const createdLinks = await this.galgameLinsService.createLink(body, req)
    return {
      data: createdLinks,
    }
  }

  @Put('/:galgame_id/:link_id')
  async updateLink(
    @Param('galgame_id') galgame_id: string,
    @Param('link_id') link_id: string,
    @Body() body: UpdateGalgameLinkDto,
    @Req() req: RequestWithUser,
  ) {
    const updatedLinks = await this.galgameLinsService.updateLink(galgame_id, link_id, body, req)
    return {
      data: updatedLinks,
    }
  }

  @Delete('/:galgame_id/:link_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLink(
    @Param('galgame_id') galgame_id: string,
    @Param('link_id') link_id: string,
    @Query() query: DeleteGalgameLinkDto,
    @Req() req: RequestWithUser,
  ) {
    await this.galgameLinsService.deleteLink(galgame_id, link_id, query, req)
  }
}
