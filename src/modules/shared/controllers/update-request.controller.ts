import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common'
import { UpdateRequestService } from '../services/update-request.service'
import { GetUpdateRequestsDto } from '../dto/get-update-requests.dto'
import { GetUpdateRequestsByEntityParamsDto } from '../dto/get-update-requests-by-entity-params.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { HikariUserGroup } from '../../auth/enums/hikari-user-group.enum'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
import { Types } from 'mongoose'
import { ProcessUpdateRequestDto } from '../dto/process-update-request.dto'

@Controller('update-request/requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(HikariUserGroup.CREATOR)
export class UpdateRequestController {
  constructor(private readonly updateRequestService: UpdateRequestService) {}

  @Get('me')
  async getUpdateRequests(@Query() options: GetUpdateRequestsDto, @Req() req: RequestWithUser) {
    const requests = await this.updateRequestService.getUserUpdateRequests(req, options)
    return {
      data: requests,
    }
  }

  @Get(':entityType/:entityId')
  async getUpdateRequestsByEntity(@Param() params: GetUpdateRequestsByEntityParamsDto) {
    const requests = await this.updateRequestService.getUpdateRequestsByEntity(params)
    return {
      data: requests,
    }
  }

  @Get('auditable')
  async getAuditableUpdateRequests(
    @Query() options: GetUpdateRequestsDto,
    @Req() req: RequestWithUser,
  ) {
    const requests = await this.updateRequestService.getUserAuditableUpdateRequests(req, options)
    return {
      data: requests,
    }
  }

  @Patch(':id/process')
  async processUpdateRequest(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() processUpdateRequestDto: ProcessUpdateRequestDto,
  ) {
    const request = await this.updateRequestService.processUpdateRequest(
      new Types.ObjectId(id),
      processUpdateRequestDto,
      req,
    )
    return {
      data: request,
    }
  }
}
