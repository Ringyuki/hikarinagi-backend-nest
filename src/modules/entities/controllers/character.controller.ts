import { Controller, Get, Param, Req } from '@nestjs/common'
import { CharacterService } from '../services/character.service'
import { RequestWithUser } from 'src/modules/auth/interfaces/request-with-user.interface'

@Controller('character')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Get('/:id')
  async findById(@Param('id') id: string | number, @Req() req: RequestWithUser) {
    const character = await this.characterService.findById(id, req)
    return {
      data: character,
    }
  }
}
