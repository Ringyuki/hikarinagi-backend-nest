import { Controller, Get, Post, Query, UseGuards, Body, Put } from '@nestjs/common'
import { AdComponentService } from '../../services/components/ad-component.service'
import { UIComponentService } from '../../services/ui-component.service'
import { GetAdsDto } from '../../dto/get-ads.dto'
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../auth/guards/roles.guard'
import { Roles } from '../../../auth/decorators/roles.decorator'
import { HikariUserGroup } from '../../../auth/enums/hikari-user-group.enum'
import { UpdateAdComponentDto } from '../../dto/update-ui-component.dto'
import { CreateUIComponentDto } from '../../dto/create-ui-component.dto'
import { UIComponentType } from '../../enums/UIComponentType.enum'

@Controller('components/ad')
export class AdComponentController {
  constructor(
    private adComponentService: AdComponentService,
    private uiComponentService: UIComponentService,
  ) {}

  @Get('get-ads')
  async getAds(@Query() query: GetAdsDto) {
    const ads = await this.adComponentService.getAds(query.page, query.position)
    return {
      data: ads,
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(HikariUserGroup.SUPER_ADMIN)
  @Put('update')
  async updateAdComponent(@Body() dto: UpdateAdComponentDto) {
    const data = await this.adComponentService.updateAdComponent(dto)
    return {
      data,
      message: 'updated',
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(HikariUserGroup.SUPER_ADMIN)
  @Post('create')
  async createAdComponent(@Body() dto: CreateUIComponentDto) {
    const data = await this.uiComponentService.create({
      ...dto,
      type: UIComponentType.ADVERTISEMENT,
    })
    return {
      data,
      message: 'created',
    }
  }
}
