import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Person, PersonDocument } from '../../entities/schemas/person.schema'
import { Producer, ProducerDocument } from '../../entities/schemas/producer.schema'
import { Character, CharacterDocument } from '../../entities/schemas/character.schema'
import { Tag, TagDocument } from '../../entities/schemas/tag.schema'
import { Galgame, GalgameDocument } from '../../galgame/schemas/galgame.schema'
import { GetEntityListDto } from '../dto/entity/get-entity-list.dto'
import { UpdateEntityDto } from '../dto/entity/update-entity.dto'
import { UpdateRequest, UpdateRequestDocument } from '../../shared/schemas/update-request.schema'
import { UpdateRequestService } from '../../shared/services/update-request.service'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
import { EntityType } from '../dto/entity/get-entity-list.dto'

@Injectable()
export class EntityManagementService {
  constructor(
    @InjectModel(Person.name) private personModel: Model<PersonDocument>,
    @InjectModel(Producer.name) private producerModel: Model<ProducerDocument>,
    @InjectModel(Character.name) private characterModel: Model<CharacterDocument>,
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
    @InjectModel(Galgame.name) private galgameModel: Model<GalgameDocument>,
    @InjectModel(UpdateRequest.name) private updateRequestModel: Model<UpdateRequestDocument>,
    private readonly updateRequestService: UpdateRequestService,
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

  async getEntity(
    type: 'person' | 'producer' | 'character' | 'tag',
    id: number,
    req: RequestWithUser,
  ) {
    if (!id) {
      throw new BadRequestException('Id is required')
    }

    const mapToEntityType = (type: 'person' | 'producer' | 'character' | 'tag'): EntityType => {
      switch (type) {
        case 'person':
          return EntityType.Person
        case 'producer':
          return EntityType.Producer
        case 'character':
          return EntityType.Character
        case 'tag':
          return EntityType.Tag
      }
    }

    const entityType = mapToEntityType(type)
    const hikariUserGroup = req.user.hikariUserGroup
    const Model = this.getModel(entityType)
    if (!Model) {
      throw new BadRequestException('Invalid entity type')
    }

    if (entityType === EntityType.Tag) {
      const tag = await this.tagModel
        .findOne({ id })
        .select('id name aliases description status createdAt updatedAt -_id')
        .lean()

      if (!tag) {
        throw new NotFoundException('Entity not found')
      }

      if (
        tag.status !== 'published' &&
        hikariUserGroup !== 'admin' &&
        hikariUserGroup !== 'superAdmin'
      ) {
        throw new ForbiddenException('No permission to access this entity')
      }

      return tag
    }

    let entityDoc = await Model.findOne({ id }).select('-__v')
    if (!entityDoc) {
      throw new NotFoundException('Entity not found')
    }

    // Populate relations based on type
    if (entityType === EntityType.Person || entityType === EntityType.Producer) {
      entityDoc = await entityDoc.populate([
        {
          path: 'works.work',
          select: 'name transTitle name_cn originTitle novelId galId cover status',
        },
      ])
    }

    if (entityType === EntityType.Character) {
      entityDoc = await entityDoc.populate([
        {
          path: 'act.person',
          select: 'name transName image',
        },
        {
          path: 'relations.character',
          select: 'name transName image',
        },
        {
          path: 'act.work.workId',
          select: 'name transTitle name_cn originTitle novelId galId cover status',
        },
      ])
    }

    const entity = entityDoc.toObject()

    if (Array.isArray((entity as any).works)) {
      const filteredWorks = (entity as any).works.filter((w: any) => w?.work)

      const worksToDelete = []

      const workIdMap = new Map()
      const duplicateWorks = []

      filteredWorks.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })

      filteredWorks.forEach((workItem: any, index: number) => {
        if (!workItem?.work?._id) return

        const workId = workItem.work._id.toString()

        if (workIdMap.has(workId)) {
          duplicateWorks.push({
            work: workItem.work._id,
            workType: workItem.workType,
          })
        } else {
          workIdMap.set(workId, {
            index,
            item: workItem,
          })
        }
      })

      worksToDelete.push(...duplicateWorks)

      const processedWorks = []
      for (const workItem of filteredWorks) {
        const work = workItem.work
        let shouldDelete = false

        if (entityType === EntityType.Person && workItem.workType === 'Galgame') {
          const galgame = await this.galgameModel
            .findById(work._id)
            .populate('characters.character', 'act')
            .lean()

          if (galgame) {
            const personId = entity._id.toString()

            const staffRoles = []
            if (galgame.staffs && Array.isArray(galgame.staffs)) {
              galgame.staffs.forEach(staff => {
                if (staff.person && staff.person.toString() === personId) {
                  if (staff.role) {
                    staffRoles.push(staff.role)
                  }
                }
              })
            }

            const voicedCharacters = []
            if (galgame.characters && Array.isArray(galgame.characters)) {
              galgame.characters.forEach(char => {
                const characterData = char.character as any
                if (characterData && characterData.act && Array.isArray(characterData.act)) {
                  const hasActor = characterData.act.some(
                    (actItem: any) =>
                      actItem.person &&
                      actItem.person.toString() === personId &&
                      actItem.work &&
                      actItem.work.workType === 'Galgame' &&
                      actItem.work.workId.toString() === work._id.toString(),
                  )
                  if (hasActor) {
                    voicedCharacters.push(characterData)
                  }
                }
              })
            }

            if (staffRoles.length === 0 && voicedCharacters.length === 0) {
              worksToDelete.push({ work: work._id, workType: 'Galgame' })
              shouldDelete = true
            }
          }
        }

        if (!shouldDelete) {
          const nameCandidate =
            work?.name ||
            work?.transTitle ||
            work?.name_cn ||
            (Array.isArray(work?.originTitle) ? work.originTitle[0] : '') ||
            ''
          processedWorks.push({
            workType: workItem.workType,
            work: work?._id,
            name: nameCandidate,
            cover: work?.cover,
          })
        }
      }

      ;(entity as any).works = processedWorks

      if (worksToDelete.length > 0 && entityType === EntityType.Person) {
        await this.personModel.updateOne({ id }, { $pull: { works: { $or: worksToDelete } } })
      }
    }

    if (entityType === EntityType.Character && Array.isArray((entity as any).act)) {
      ;(entity as any).act = (entity as any).act.map((actItem: any) => {
        const workDoc = actItem?.work?.workId
        const nameCandidate =
          workDoc?.name ||
          workDoc?.transTitle ||
          workDoc?.name_cn ||
          (Array.isArray(workDoc?.originTitle) ? workDoc.originTitle[0] : '') ||
          ''
        return {
          person: actItem.person,
          work: {
            workType: actItem?.work?.workType,
            workId: workDoc?._id,
            name: nameCandidate,
            cover: workDoc?.cover,
          },
        }
      })
    }

    if (
      (entity as any).status !== 'published' &&
      hikariUserGroup !== 'admin' &&
      hikariUserGroup !== 'superAdmin'
    ) {
      throw new ForbiddenException('No permission to access this entity')
    }

    return entity
  }

  async updateEntity(type: EntityType, id: number, data: UpdateEntityDto, req: RequestWithUser) {
    const Model = this.getModel(type)
    const hikariUserGroup = req.user.hikariUserGroup

    if (type !== EntityType.Tag) {
      const entity = await Model.findOne({ id })
      if (!entity) {
        throw new NotFoundException('Entity not found')
      }

      const exisitedRequest = await this.updateRequestModel.findOne({
        entityId: entity._id,
        requestedBy: new Types.ObjectId(req.user._id),
        status: 'pending',
      })
      if (exisitedRequest) {
        throw new BadRequestException('You have a pending update request for this item')
      }

      const updatedEntity = data
      const originalEntity = entity.toJSON({ _transformToUpdateRequestFormat: true })

      await this.updateRequestService.createUpdateRequest(
        {
          entityType: type,
          entityId: entity._id,
          title: `${type} 更新请求`,
          description: `更新 ${type} 条目`,
          requestedBy: new Types.ObjectId(req.user._id),
          changes: {
            previous: originalEntity,
            updated: updatedEntity,
          },
        },
        req,
      )

      return updatedEntity
    } else {
      const tag = await this.tagModel.findOne({ id })
      if (!tag) {
        throw new NotFoundException('Tag not found')
      }

      if (
        hikariUserGroup !== 'admin' &&
        hikariUserGroup !== 'superAdmin' &&
        tag.creator.userId.toString() !== req.user._id.toString()
      ) {
        throw new ForbiddenException('No permission to update this entity')
      }

      const protectedFields = ['id', 'creator', 'createdAt']
      protectedFields.forEach(field => delete data[field])

      const updateData = { ...data }

      const updatedTag = await this.tagModel.findOneAndUpdate(
        { id },
        { $set: updateData },
        { new: true },
      )

      return updatedTag
    }
  }
}
