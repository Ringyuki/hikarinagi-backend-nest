import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { EntityManagementService } from '../services/entity-management.service'
import { EntityType, GetEntityListDto } from '../dto/get-entity-list.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { HikariUserGroup } from '../../auth/enums/hikari-user-group.enum'

@Controller('creator-center/entity')
@UseGuards(JwtAuthGuard)
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
}
