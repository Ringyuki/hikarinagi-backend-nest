import { Controller, Get, Inject, Query } from '@nestjs/common'
import { SearchService } from '../services/search.service'
import { SearchDto } from '../dto/search.dto'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  async search(@Query() searchDto: SearchDto) {
    const { keyword, type, page, limit, relative_match } = searchDto
    const cacheKey = `${keyword}-${type}-${page}-${limit}-${relative_match}`
    const cachedResult = await this.cacheManager.get(cacheKey)
    if (cachedResult) {
      return {
        data: cachedResult,
        cached: true,
      }
    }

    const result = await this.searchService.search(searchDto)
    await this.cacheManager.set(cacheKey, result, 60 * 60 * 1000)
    return {
      data: result,
    }
  }
}
