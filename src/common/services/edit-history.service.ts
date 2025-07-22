import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import {
  GalgameHistory,
  GalgameHistoryDocument,
} from '../../modules/galgame/schemas/galgame-history.schema'
import {
  LightNovelHistory,
  LightNovelHistoryDocument,
} from '../../modules/novel/schemas/light-novel-history.schema'
import {
  LightNovelVolumeHistory,
  LightNovelVolumeHistoryDocument,
} from '../../modules/novel/schemas/light-novel-volume-history.schema'
import {
  SharedEntityHistory,
  SharedEntityHistoryDocument,
} from '../../modules/entities/schemas/shared-entity-history.schema'
import { Producer, ProducerDocument } from '../../modules/entities/schemas/producer.schema'
import { Person, PersonDocument } from '../../modules/entities/schemas/person.schema'
import { Character, CharacterDocument } from '../../modules/entities/schemas/character.schema'

interface RecordHistoryParams {
  type: 'galgame' | 'lightNovel' | 'LightNovelVolume' | 'producer' | 'person' | 'character'
  actionType: 'create' | 'update' | 'delete'
  /**
   * @name galId
   * @description galgame条目id，非_id(Types.ObjectId)
   */
  galId?: string
  /**
   * @name novelId
   * @description lightNovel条目id，非_id(Types.ObjectId)
   */
  novelId?: string
  /**
   * @name volumeId
   * @description lightNovelVolume条目id，非_id(Types.ObjectId)
   */
  volumeId?: string
  /**
   * @name entityId
   * @description 实体_id(Types.ObjectId)，传入number时，会自动转换为Types.ObjectId
   */
  entityId?: number | Types.ObjectId
  userId: Types.ObjectId
  userName: string
  changes: string
  previous?: any
  updated?: any
}

export interface ContributorInfo {
  editedAt: Date
  userInfo: {
    name: string
    avatar?: string
    userId: string
  }
}

export interface ContributorsResult {
  contributors: Array<{
    count: number
    userInfo: {
      userId: string
      name: string
      avatar?: string
    }
  }>
  createdBy: ContributorInfo | null
  lastEditBy: ContributorInfo | null
}

@Injectable()
export class EditHistoryService {
  constructor(
    @InjectModel(GalgameHistory.name)
    private galgameHistoryModel: Model<GalgameHistoryDocument>,
    @InjectModel(LightNovelHistory.name)
    private lightNovelHistoryModel: Model<LightNovelHistoryDocument>,
    @InjectModel(LightNovelVolumeHistory.name)
    private lightNovelVolumeHistoryModel: Model<LightNovelVolumeHistoryDocument>,
    @InjectModel(SharedEntityHistory.name)
    private sharedEntityHistoryModel: Model<SharedEntityHistoryDocument>,
    @InjectModel(Producer.name)
    private producerModel: Model<ProducerDocument>,
    @InjectModel(Person.name)
    private personModel: Model<PersonDocument>,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
  ) {}

  async recordEditHistory(params: RecordHistoryParams): Promise<void> {
    const {
      type,
      actionType,
      galId,
      novelId,
      volumeId,
      entityId,
      userId,
      userName,
      changes,
      previous,
      updated,
    } = params

    if (
      !type ||
      !actionType ||
      (!galId && !novelId && !volumeId && !entityId) ||
      !userId ||
      !userName ||
      !changes
    ) {
      throw new Error('Missing required parameters')
    }

    const detailedChanges = { previous, updated }

    switch (type) {
      case 'galgame':
        await this.galgameHistoryModel.create({
          galId,
          actionType,
          userId,
          name: userName,
          changes,
          detailedChanges,
        })
        break

      case 'lightNovel':
        await this.lightNovelHistoryModel.create({
          novelId,
          actionType,
          userId,
          name: userName,
          changes,
          detailedChanges,
        })
        break

      case 'LightNovelVolume':
        await this.lightNovelVolumeHistoryModel.create({
          volumeId,
          actionType,
          userId,
          name: userName,
          changes,
          detailedChanges,
        })
        break

      case 'producer':
      case 'person':
      case 'character':
        await this.sharedEntityHistoryModel.create({
          entityType: type,
          entityId,
          actionType,
          userId,
          userName,
          changes,
          detailedChanges,
        })
        break

      default:
        throw new Error(`Invalid type provided: ${type}`)
    }
  }

  async getContributors(type: string, id: string | number): Promise<ContributorsResult> {
    if (!type || !id) {
      throw new Error('Missing required parameters')
    }

    if (type === 'galgame') {
      return await this.getGalgameContributors(String(id))
    } else if (type === 'lightNovel') {
      return await this.getLightNovelContributors(String(id))
    } else if (type === 'LightNovelVolume') {
      return await this.getLightNovelVolumeContributors(String(id))
    } else if (['producer', 'person', 'character'].includes(type)) {
      let entity
      if (type === 'producer') {
        entity = await this.producerModel.findOne({ id }).select('_id').lean()
      } else if (type === 'person') {
        entity = await this.personModel.findOne({ id }).select('_id').lean()
      } else if (type === 'character') {
        entity = await this.characterModel.findOne({ id }).select('_id').lean()
      } else {
        throw new Error('Invalid entity type provided')
      }
      return await this.getSharedEntityContributors(type, entity._id)
    } else {
      throw new Error('Invalid type provided')
    }
  }

  private async getGalgameContributors(galId: string): Promise<ContributorsResult> {
    const firstCreator = await this.galgameHistoryModel
      .findOne({ galId })
      .sort({ editedAt: 1 })
      .select('userId editedAt -_id')
      .populate('userId', 'userId name avatar -_id')
      .lean()

    const lastEditor = await this.galgameHistoryModel
      .findOne({ galId })
      .sort({ editedAt: -1 })
      .select('userId editedAt -_id')
      .populate('userId', 'userId name avatar -_id')
      .lean()

    const createdBy = firstCreator
      ? {
          editedAt: firstCreator.editedAt,
          userInfo: firstCreator.userId as any,
        }
      : null

    const lastEditBy = lastEditor
      ? {
          editedAt: lastEditor.editedAt,
          userInfo: lastEditor.userId as any,
        }
      : null

    const contributors = await this.galgameHistoryModel.aggregate([
      { $match: { galId } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      { $unwind: '$userInfo' },
      {
        $project: {
          count: 1,
          userInfo: {
            userId: '$userInfo.userId',
            name: '$userInfo.name',
            avatar: '$userInfo.avatar',
          },
        },
      },
    ])

    contributors.forEach(contributor => {
      delete contributor._id
    })

    return {
      contributors,
      createdBy,
      lastEditBy,
    }
  }

  private async getLightNovelContributors(novelId: string): Promise<ContributorsResult> {
    const firstCreator = await this.lightNovelHistoryModel
      .findOne({ novelId })
      .sort({ editedAt: 1 })
      .select('userId editedAt -_id')
      .populate('userId', 'userId name avatar -_id')
      .lean()

    const lastEditor = await this.lightNovelHistoryModel
      .findOne({ novelId })
      .sort({ editedAt: -1 })
      .select('userId editedAt -_id')
      .populate('userId', 'userId name avatar -_id')
      .lean()

    const createdBy = firstCreator
      ? {
          editedAt: firstCreator.editedAt,
          userInfo: firstCreator.userId as any,
        }
      : null

    const lastEditBy = lastEditor
      ? {
          editedAt: lastEditor.editedAt,
          userInfo: lastEditor.userId as any,
        }
      : null

    const contributors = await this.lightNovelHistoryModel.aggregate([
      { $match: { novelId } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      { $unwind: '$userInfo' },
      {
        $project: {
          count: 1,
          userInfo: {
            userId: '$userInfo.userId',
            name: '$userInfo.name',
            avatar: '$userInfo.avatar',
          },
        },
      },
    ])

    contributors.forEach(contributor => {
      delete contributor._id
    })

    return {
      contributors,
      createdBy,
      lastEditBy,
    }
  }

  private async getLightNovelVolumeContributors(volumeId: string): Promise<ContributorsResult> {
    const firstCreator = await this.lightNovelVolumeHistoryModel
      .findOne({ volumeId })
      .sort({ editedAt: 1 })
      .select('userId editedAt -_id')
      .populate('userId', 'userId name avatar -_id')
      .lean()

    const lastEditor = await this.lightNovelVolumeHistoryModel
      .findOne({ volumeId })
      .sort({ editedAt: -1 })
      .select('userId editedAt -_id')
      .populate('userId', 'userId name avatar -_id')
      .lean()

    const createdBy = firstCreator
      ? {
          editedAt: firstCreator.editedAt,
          userInfo: firstCreator.userId as any,
        }
      : null

    const lastEditBy = lastEditor
      ? {
          editedAt: lastEditor.editedAt,
          userInfo: lastEditor.userId as any,
        }
      : null

    const contributors = await this.lightNovelVolumeHistoryModel.aggregate([
      { $match: { volumeId } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      { $unwind: '$userInfo' },
      {
        $project: {
          count: 1,
          userInfo: {
            userId: '$userInfo.userId',
            name: '$userInfo.name',
            avatar: '$userInfo.avatar',
          },
        },
      },
    ])

    contributors.forEach(contributor => {
      delete contributor._id
    })

    return {
      contributors,
      createdBy,
      lastEditBy,
    }
  }

  async getSharedEntityContributors(
    entityType: string,
    entityId: Types.ObjectId,
  ): Promise<ContributorsResult> {
    const firstCreator = await this.sharedEntityHistoryModel
      .findOne({
        entityType,
        entityId,
      })
      .sort({ editedAt: 1 })
      .select('userId editedAt -_id')
      .populate('userId', 'userId name avatar -_id')
      .lean()

    const lastEditor = await this.sharedEntityHistoryModel
      .findOne({
        entityType,
        entityId,
      })
      .sort({ editedAt: -1 })
      .select('userId editedAt -_id')
      .populate('userId', 'userId name avatar -_id')
      .lean()

    const createdBy = firstCreator
      ? {
          editedAt: firstCreator.editedAt,
          userInfo: firstCreator.userId as any,
        }
      : null

    const lastEditBy = lastEditor
      ? {
          editedAt: lastEditor.editedAt,
          userInfo: lastEditor.userId as any,
        }
      : null

    let entity
    if (entityType === 'producer') {
      entity = await this.producerModel.findById(entityId).select('_id').lean()
    } else if (entityType === 'person') {
      entity = await this.personModel.findById(entityId).select('_id').lean()
    } else if (entityType === 'character') {
      entity = await this.characterModel.findById(entityId).select('_id').lean()
    } else {
      throw new Error('Invalid entity type provided')
    }

    const contributors = await this.sharedEntityHistoryModel.aggregate([
      { $match: { entityId: entity._id, entityType } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      { $unwind: '$userInfo' },
      {
        $project: {
          count: 1,
          userInfo: {
            userId: '$userInfo.userId',
            name: '$userInfo.name',
            avatar: '$userInfo.avatar',
          },
        },
      },
    ])

    contributors.forEach(contributor => {
      delete contributor._id
    })

    return {
      contributors,
      createdBy,
      lastEditBy,
    }
  }
}
