import { Controller, Req, Body, Param, Put, Get } from '@nestjs/common'
import { GalgameManagementService } from '../services/galgame-management.service'
import { UpdateGalgameDto } from '../dto/galgame/update-galgame.dto'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { UseGuards } from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
import { HikariUserGroup } from '../../auth/enums/hikari-user-group.enum'
import { RolesGuard } from '../../auth/guards/roles.guard'

@Controller('creator-center/galgame')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(HikariUserGroup.CREATOR)
export class GalgameManagementController {
  constructor(private readonly galgameManagementService: GalgameManagementService) {}

  @Put(':galId')
  async updateGalgame(
    @Param('galId') galId: string,
    @Body() data: UpdateGalgameDto,
    @Req() req: RequestWithUser,
  ) {
    const galgame = await this.galgameManagementService.updateGalgame(galId, data, req)
    return {
      data: galgame,
    }
  }

  @Get(':galId')
  @UseGuards(JwtAuthGuard)
  async getGalgame(@Param('galId') galId: string, @Req() req: RequestWithUser) {
    const galgame = await this.galgameManagementService.getGalgame(galId, req)
    return {
      data: galgame,
    }
  }
}
