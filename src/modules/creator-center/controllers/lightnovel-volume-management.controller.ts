import { Controller, Req, Body, Param, Put, UseGuards, ParseIntPipe } from '@nestjs/common'
import { LightNovelVolumeManagementService } from '../services/lightnovel-volume-management.service'
import { UpdateLightNovelVolumeDto } from '../dto/lightnovel-volume/update-lightnovel-volume.dto'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { HikariUserGroup } from '../../auth/enums/hikari-user-group.enum'

@Controller('creator-center/lightnovel/volume')
@UseGuards(JwtAuthGuard)
@Roles(HikariUserGroup.CREATOR)
export class LightNovelVolumeManagementController {
  constructor(
    private readonly lightNovelVolumeManagementService: LightNovelVolumeManagementService,
  ) {}

  @Put(':volumeId')
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
