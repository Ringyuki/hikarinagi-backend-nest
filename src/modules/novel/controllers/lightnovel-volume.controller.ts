import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { LightNovelVolumeService } from '../services/lightnovel-volume.service'
import { Roles } from '../../../modules/auth/decorators/roles.decorator'
import { HikariUserGroup } from '../../../modules/auth/enums/hikari-user-group.enum'
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { UpdateVolumeHasEpubDto } from '../dto/update-volume-has-epub.dto'
import { CreateLightNovelVolumeDto } from '../dto/create-lightnovel-volume.dto'
import { RequestWithUser } from '../../../modules/auth/interfaces/request-with-user.interface'

@Controller('lightnovel/volume')
export class LightNovelVolumeController {
  constructor(private readonly lightNovelVolumeService: LightNovelVolumeService) {}

  @Get(':id')
  async findById(@Param('id') id: string) {
    const volume = await this.lightNovelVolumeService.findById(id)
    return {
      data: volume,
    }
  }

  @Post()
  @Roles(HikariUserGroup.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createLightNovelVolume(
    @Body() body: CreateLightNovelVolumeDto,
    @Req() req: RequestWithUser,
  ) {
    const volume = await this.lightNovelVolumeService.createLightNovelVolume(body, req)
    return {
      data: volume,
    }
  }

  @Put(':id/has-epub')
  @Roles(HikariUserGroup.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateHasEpub(@Param('id') id: number, @Body() body: UpdateVolumeHasEpubDto) {
    const volume = await this.lightNovelVolumeService.updateHasEpub(id, body)
    return {
      data: volume,
    }
  }
}
