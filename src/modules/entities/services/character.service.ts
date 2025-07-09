import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Character, CharacterDocument } from '../schemas/character.schema'
import { RequestWithUser } from 'src/modules/auth/interfaces/request-with-user.interface'

@Injectable()
export class CharacterService {
  constructor(@InjectModel(Character.name) private characterModel: Model<CharacterDocument>) {}

  async findById(id: number | string, req: RequestWithUser): Promise<Character | null> {
    console.log(req.user)
    if (isNaN(Number(id))) {
      throw new BadRequestException('id must be a number')
    }
    const character = await this.characterModel.findOne({ id })
    if (!character) {
      throw new NotFoundException('character not found')
    }
    return character
  }

  async findByName(name: string): Promise<Character | null> {
    return this.characterModel.findOne({ name }).exec()
  }
}
