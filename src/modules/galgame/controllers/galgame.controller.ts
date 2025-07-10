import { Controller, Get, Param, Query, Req } from '@nestjs/common'
import { GalgameService } from '../services/galgame.service'
import { GetGalgameListDto } from '../dto/get-galgame-list.dto'
import { RequestWithUser } from 'src/modules/auth/interfaces/request-with-user.interface'

@Controller('galgame')
export class GalgameController {
  constructor(private readonly galgameService: GalgameService) {}

  @Get('list')
  async getGalgameList(@Query() query: GetGalgameListDto, @Req() req: RequestWithUser) {
    const result = await this.galgameService.getGalgameList(req, query)
    return {
      data: result,
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const galgame = await this.galgameService.findById(id)
    return {
      data: galgame,
    }
  }
}
