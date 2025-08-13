import { Controller, Inject, Get, Param, Req } from '@nestjs/common'
import { CharacterService } from '../services/character.service'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

@Controller('character')
export class CharacterController {
  constructor(
    private readonly characterService: CharacterService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('/:id')
  async findById(@Param('id') id: string | number, @Req() req: RequestWithUser) {
    const cacheKey = `character-detail:${id}`
    const cachedData = await this.cacheManager.get(cacheKey)
    if (cachedData) {
      return {
        data: cachedData,
        cached: true,
      }
    }

    const character = await this.characterService.findById(id, req)

    await this.cacheManager.set(cacheKey, character, 60 * 60 * 24 * 1000)

    return {
      data: character,
    }
  }
}
