import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Galgame, GalgameDocument } from '../schemas/galgame.schema'

@Injectable()
export class GalgameService {
  constructor(@InjectModel(Galgame.name) private galgameModel: Model<GalgameDocument>) {}

  async findById(id: number | string) {
    if (isNaN(Number(id))) {
      throw new BadRequestException('id must be a number')
    }
    const galgame = await this.galgameModel.findOne({ galId: id })
    if (!galgame) {
      throw new NotFoundException('galgame not found')
    }
    return galgame
  }
}
