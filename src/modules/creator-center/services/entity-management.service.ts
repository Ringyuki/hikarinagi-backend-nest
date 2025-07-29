import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Person, PersonDocument } from '../../entities/schemas/person.schema'
import { Producer, ProducerDocument } from '../../entities/schemas/producer.schema'
import { Character, CharacterDocument } from '../../entities/schemas/character.schema'
import { Tag, TagDocument } from '../../entities/schemas/tag.schema'
import { GetEntityListDto, EntityType } from '../dto/get-entity-list.dto'

@Injectable()
export class EntityManagementService {
  constructor(
    @InjectModel(Person.name) private personModel: Model<PersonDocument>,
    @InjectModel(Producer.name) private producerModel: Model<ProducerDocument>,
    @InjectModel(Character.name) private characterModel: Model<CharacterDocument>,
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
  ) {}

  private getModel(type: EntityType): Model<any> {
    switch (type) {
      case EntityType.Person:
        return this.personModel
      case EntityType.Producer:
        return this.producerModel
      case EntityType.Character:
        return this.characterModel
      case EntityType.Tag:
        return this.tagModel
    }
  }

  async getEntityList(type: EntityType, queryDto: GetEntityListDto) {
    const { keyword, page, limit } = queryDto
    const Model = this.getModel(type)

    const query: any = {}
    if (keyword) {
      query.$or = [
        { name: new RegExp(keyword, 'i') },
        { transName: new RegExp(keyword, 'i') },
        { aliases: new RegExp(keyword, 'i') },
      ]
    }

    if (type === EntityType.Tag) {
      const total = await this.tagModel.countDocuments(query)
      const entities = await this.tagModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('id name')
        .lean()

      return {
        entities,
        meta: {
          totalItems: total,
          itemCount: entities.length,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      }
    } else {
      const total = await Model.countDocuments(query)
      const entities = await Model.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('_id name image logo note role')
        .lean()

      return {
        entities,
        meta: {
          totalItems: total,
          itemCount: entities.length,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      }
    }
  }
}
