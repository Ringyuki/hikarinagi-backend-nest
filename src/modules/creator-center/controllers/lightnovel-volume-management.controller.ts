import { Controller, Req, Body, Param, Put, UseGuards, ParseIntPipe, Get } from '@nestjs/common'
import { LightNovelVolumeManagementService } from '../services/lightnovel-volume-management.service'
import { UpdateLightNovelVolumeDto } from '../dto/lightnovel-volume/update-lightnovel-volume.dto'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { HikariUserGroup } from '../../auth/enums/hikari-user-group.enum'
import { RolesGuard } from '../../auth/guards/roles.guard'

@Controller('creator-center/lightnovel/volume')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LightNovelVolumeManagementController {
  constructor(
    private readonly lightNovelVolumeManagementService: LightNovelVolumeManagementService,
  ) {}

  @Get(':volumeId')
  @Roles(HikariUserGroup.CREATOR)
  async getLightNovelVolume(@Param('volumeId', ParseIntPipe) volumeId: number) {
    const data = await this.lightNovelVolumeManagementService.getLightNovelVolume(volumeId)
    return {
      data,
    }
  }

  @Put(':volumeId')
  @Roles(HikariUserGroup.CREATOR)
  async updateLightNovelVolume(
    @Param('volumeId', ParseIntPipe) volumeId: number,
    @Body() data: UpdateLightNovelVolumeDto,
    @Req() req: RequestWithUser,
  ) {
    const result = await this.lightNovelVolumeManagementService.updateLightNovelVolume(
      volumeId,
      data,
      req,
    )
    return {
      data: result,
    }
  }
}
