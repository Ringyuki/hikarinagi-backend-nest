import { Controller, Get, Param } from '@nestjs/common'
import { GalgameService } from '../services/galgame.service'

@Controller('galgame')
export class GalgameController {
  constructor(private readonly galgameService: GalgameService) {}

  @Get(':id')
  async findById(@Param('id') id: string) {
    const galgame = await this.galgameService.findById(id)
    return {
      data: galgame,
    }
  }
}
