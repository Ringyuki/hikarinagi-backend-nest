import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { LightNovel, LightNovelDocument } from '../../novel/schemas/light-novel.schema'
import { UpdateRequest, UpdateRequestDocument } from '../../shared/schemas/update-request.schema'
import { UpdateRequestService } from '../../shared/services/update-request.service'
import { UpdateLightNovelDto } from '../dto/lightnovel/update-lightnovel.dto'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
import { EntityType } from '../../shared/dto/create-update-request.dto'

@Injectable()
export class LightNovelManagementService {
  constructor(
    @InjectModel(LightNovel.name) private lightNovelModel: Model<LightNovelDocument>,
    @InjectModel(UpdateRequest.name) private updateRequestModel: Model<UpdateRequestDocument>,
    private readonly updateRequestService: UpdateRequestService,
  ) {}

  async updateLightNovel(novelId: string, data: UpdateLightNovelDto, req: RequestWithUser) {
    const lightNovel = await this.lightNovelModel
      .findOne({ novelId })
      .populate('tags.tag')
      .populate('author')
      .populate('illustrators.illustrator')
      .populate('characters.character')
      .populate('publishers.publisher')
      .populate('bunko')
      .populate('series.volumes')
    if (!lightNovel) {
      throw new NotFoundException('Light novel not found')
    }

    if (lightNovel.status !== 'published') {
      throw new BadRequestException('Item status must be published to update')
    }

    const exisitedRequest = await this.updateRequestModel.findOne({
      entityId: lightNovel._id,
      requestedBy: new Types.ObjectId(req.user._id),
      status: 'pending',
    })
    if (exisitedRequest) {
      throw new BadRequestException('You have a pending update request for this item')
    }

    const updatedLightNovel = data
    if (updatedLightNovel.creator && (updatedLightNovel.creator as any)._id) {
      const creator = updatedLightNovel.creator as any
      updatedLightNovel.creator = {
        userId: creator._id,
        name: creator.name,
      }
    }
    if (updatedLightNovel.series && updatedLightNovel.series.volumes) {
      ;(updatedLightNovel.series.volumes as any) = updatedLightNovel.series.volumes.map(v =>
        v._id ? v._id : v,
      )
    }
    delete updatedLightNovel.updatedAt
    delete updatedLightNovel.createdAt
    const originalLightNovel = lightNovel.toJSON({ transformToUpdateRequestFormat: true })

    await this.updateRequestService.createUpdateRequest({
      entityType: EntityType.LightNovel,
      entityId: lightNovel._id as Types.ObjectId,
      title: 'LightNovel 更新请求',
      description: '更新 LightNovel 条目',
      requestedBy: new Types.ObjectId(req.user._id),
      changes: {
        previous: originalLightNovel,
        updated: updatedLightNovel,
        changedFields: Object.keys(updatedLightNovel),
      },
    })

    return {
      original: originalLightNovel,
      updated: updatedLightNovel,
    }
  }
}
