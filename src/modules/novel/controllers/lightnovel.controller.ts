import { Controller, Get, Inject, Param, Query, Req } from '@nestjs/common'
import { LightNovelService } from '../services/lightnovel.service'
import { GetLightNovelListDto } from '../dto/get-lightnovel-list.dto'
import { RequestWithUser } from '../../../modules/auth/interfaces/request-with-user.interface'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

@Controller('lightnovel')
export class LightNovelController {
  constructor(
    private readonly lightNovelService: LightNovelService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  @Get('list')
  async getLightNovelList(@Req() req: RequestWithUser, @Query() query: GetLightNovelListDto) {
    const cacheKey = `lightnovel-list-${JSON.stringify(query)}`
    const cachedData = await this.cacheManager.get(cacheKey)
    if (cachedData) {
      return {
        data: cachedData,
        cached: true,
      }
    }
    const novels = await this.lightNovelService.getLightNovelList(req, query)
    await this.cacheManager.set(cacheKey, novels, 60 * 60 * 24)
    return {
      data: novels,
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const novel = await this.lightNovelService.findById(id)
    return {
      data: novel,
    }
  }
}
