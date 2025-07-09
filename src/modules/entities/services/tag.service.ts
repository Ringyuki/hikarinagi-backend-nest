import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Tag, TagDocument } from '../schemas/tag.schema'

@Injectable()
export class TagService {
  constructor(@InjectModel(Tag.name) private tagModel: Model<TagDocument>) {}

  async findAll(): Promise<Tag[]> {
    return this.tagModel.find().exec()
  }

  async findById(id: number): Promise<Tag | null> {
    return this.tagModel.findOne({ id }).exec()
  }

  async findByName(name: string): Promise<Tag | null> {
    return this.tagModel.findOne({ name }).exec()
  }

  async search(query: string): Promise<Tag[]> {
    return this.tagModel
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { aliases: { $in: [new RegExp(query, 'i')] } },
          { description: { $regex: query, $options: 'i' } },
        ],
      })
      .exec()
  }
}
