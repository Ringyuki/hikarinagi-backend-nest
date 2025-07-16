import { Controller, Get, Post, Param, Query, Req, Body, UseGuards } from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
import { GalgameService } from '../services/galgame.service'
import { GetGalgameListDto } from '../dto/get-galgame-list.dto'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { HikariUserGroup } from '../../auth/enums/hikari-user-group.enum'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { DownloadAuthDto } from '../dto/download-auth.dto'
import { DisableNSFWFilter } from '../../auth/decorators/disable-nsfw-filter.decorator'
import { CreateGalgameDto } from '../dto/create-galgame.dto'

@Controller('galgame')
export class GalgameController {
  constructor(private readonly galgameService: GalgameService) {}

  @Get('list')
  async getGalgameList(@Query() query: GetGalgameListDto, @Req() req: RequestWithUser) {
    const result = await this.galgameService.getGalgameList(req, query)
    return {
      data: result,
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<{ data: any }> {
    const galgame = await this.galgameService.findById(id)
    return {
      data: galgame,
    }
  }

  @Get(':id/download-info')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(HikariUserGroup.USER)
  async getDownloadInfo(@Param('id') id: string) {
    const downloadInfo = await this.galgameService.getDownloadInfo(id)
    return {
      data: downloadInfo,
    }
  }

  @Post('download-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(HikariUserGroup.USER)
  async getDownloadAuthInfo(@Body() body: DownloadAuthDto, @Req() req: RequestWithUser) {
    const downloadAuthInfo = await this.galgameService.getDownloadAuthInfo(
      body.id,
      body.timestamp,
      req,
    )
    return {
      data: downloadAuthInfo,
    }
  }

  @Get(':id/links')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(HikariUserGroup.USER)
  async getGameLinks(@Param('id') id: string) {
    const links = await this.galgameService.getGameLinks(id)
    return {
      data: links,
    }
  }

  @Get(':id/related')
  @DisableNSFWFilter()
  async getRelatedGalgames(@Param('id') id: string, @Req() req: RequestWithUser) {
    const relatedGalgames = await this.galgameService.getRelatedGalgames(id, req)
    return {
      data: relatedGalgames,
    }
  }

  @Get('fetch-bangumi-data/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(HikariUserGroup.CREATOR)
  async fetchBangumiData(@Param('id') id: string) {
    const bangumiData = await this.galgameService.fetchGameDataFromBangumi(id)
    return {
      data: bangumiData,
    }
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(HikariUserGroup.CREATOR)
  async createGalgame(@Body() body: CreateGalgameDto, @Req() req: RequestWithUser) {
    const galgame = await this.galgameService.createGalgame(body, req)
    return {
      data: galgame,
    }
  }
}
