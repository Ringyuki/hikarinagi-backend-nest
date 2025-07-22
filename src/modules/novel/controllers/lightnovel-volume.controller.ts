import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common'
import { LightNovelVolumeService } from '../services/lightnovel-volume.service'
import { Roles } from 'src/modules/auth/decorators/roles.decorator'
import { HikariUserGroup } from 'src/modules/auth/enums/hikari-user-group.enum'
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/modules/auth/guards/roles.guard'
import { UpdateVolumeHasEpubDto } from '../dto/update-volume-has-epub.dto'

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

  @Put(':id/has-epub')
  @Roles(HikariUserGroup.ADMIN, HikariUserGroup.CREATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateHasEpub(@Param('id') id: number, @Body() body: UpdateVolumeHasEpubDto) {
    const volume = await this.lightNovelVolumeService.updateHasEpub(id, body)
    return {
      data: volume,
    }
  }
}
