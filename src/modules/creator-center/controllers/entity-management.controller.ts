import { Controller, Get, Param, Query, Req, UseGuards, Put, Body } from '@nestjs/common'
import { EntityManagementService } from '../services/entity-management.service'
import { EntityType, GetEntityListDto } from '../dto/entity/get-entity-list.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { HikariUserGroup } from '../../auth/enums/hikari-user-group.enum'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { UpdateEntityDto } from '../dto/entity/update-entity.dto'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'

@Controller('creator-center/entity')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(HikariUserGroup.CREATOR)
export class EntityManagementController {
  constructor(private readonly entityManagementService: EntityManagementService) {}

  @Get('/list/:type')
  async getEntityList(@Param('type') type: EntityType, @Query() query: GetEntityListDto) {
    const result = await this.entityManagementService.getEntityList(type, query)
    return {
      data: result,
    }
  }

  @Get(':type/:id')
  async getEntity(
    @Param('type') type: 'person' | 'producer' | 'character' | 'tag',
    @Param('id') id: number,
    @Req() req: RequestWithUser,
  ) {
    const result = await this.entityManagementService.getEntity(type, id, req)
    return {
      data: result,
    }
  }

  @Put(':type/:id')
  async updateEntity(
    @Param('type') type: EntityType,
    @Param('id') id: number,
    @Body() data: UpdateEntityDto,
    @Req() req: RequestWithUser,
  ) {
    const result = await this.entityManagementService.updateEntity(type, id, data, req)
    return {
      data: result,
    }
  }
}
