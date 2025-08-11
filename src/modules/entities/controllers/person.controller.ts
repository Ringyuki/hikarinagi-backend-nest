import { Controller, Get, Param, NotFoundException, Req } from '@nestjs/common'
import { PersonService } from '../services/person.service'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'

@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Get('/:id')
  async findById(@Param('id') id: number, @Req() req: RequestWithUser) {
    let nsfw = false
    if (req.user && req.user.userSetting) {
      nsfw = req.user.userSetting.showNSFWContent
    }

    const person = await this.personService.findById(id, nsfw)
    if (!person) {
      throw new NotFoundException(`Person with id ${id} not found`)
    }
    return {
      data: person,
    }
  }
}
