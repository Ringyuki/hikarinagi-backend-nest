import { Controller, Get, Query } from '@nestjs/common'
import { UIComponentService } from '../services/ui-component.service'
import { GetUIComponentDto } from '../dto/get-ui-component.dto'

@Controller('ui-component')
export class UIComponentController {
  constructor(private readonly uiComponentService: UIComponentService) {}

  @Get()
  async findAll(@Query() dto: GetUIComponentDto) {
    const components = await this.uiComponentService.findAll(dto)
    return {
      data: components,
    }
  }
}
