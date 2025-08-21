import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import {
  LightNovelVolume,
  LightNovelVolumeDocument,
} from '../../novel/schemas/light-novel-volume.schema'
import { UpdateRequest, UpdateRequestDocument } from '../../shared/schemas/update-request.schema'
import { UpdateRequestService } from '../../shared/services/update-request.service'
import { UpdateLightNovelVolumeDto } from '../dto/lightnovel-volume/update-lightnovel-volume.dto'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
import { EntityType } from '../../shared/dto/create-update-request.dto'

@Injectable()
export class LightNovelVolumeManagementService {
  constructor(
    @InjectModel(LightNovelVolume.name)
    private lightNovelVolumeModel: Model<LightNovelVolumeDocument>,
    @InjectModel(UpdateRequest.name)
    private updateRequestModel: Model<UpdateRequestDocument>,
    private readonly updateRequestService: UpdateRequestService,
  ) {}

  async getLightNovelVolume(volumeId: number) {
    const volume = await this.lightNovelVolumeModel
      .findOne({ volumeId })
      .select(
        'bangumiBookId seriesId volumeId cover name name_cn summary summary_cn volumeType volumeNumber volumeExtraName publicationDate isbn price pages status relation hasEpub createdAt updatedAt creator -_id',
      )
      .populate({ path: 'seriesId', select: 'novelId _id' })
      .lean()

    if (!volume) {
      throw new NotFoundException('Volume not found')
    }

    const result: any = { ...volume }
    result.novelId = (volume.seriesId as any).novelId
    result.seriesId = (volume.seriesId as any)._id

    if (!result.volumeExtraName) {
      result.volumeExtraName = ''
    }
    if (!result.volumeType) {
      result.volumeType = 'main'
    }
    if (!result.volumeNumber) {
      result.volumeNumber = ''
    }
    if (!result.price) {
      result.price = {
        amount: 0,
        currency: 'JPY',
      }
    }
    if (!result.pages) {
      result.pages = 0
    }
    if (!result.publicationDate) {
      result.publicationDate = '2077-01-01'
    }

    return result
  }

  async updateLightNovelVolume(
    volumeId: number,
    data: UpdateLightNovelVolumeDto,
    req: RequestWithUser,
  ) {
    const volume = await this.lightNovelVolumeModel.findOne({ volumeId })
    if (!volume) {
      throw new NotFoundException('Light novel volume not found')
    }

    if (volume.status !== 'published') {
      throw new BadRequestException('Item status must be published to update')
    }

    const exisitedRequest = await this.updateRequestModel.findOne({
      entityId: volume._id,
      status: 'pending',
    })
    if (exisitedRequest) {
      throw new BadRequestException('There are pending update requests for this item')
    }

    const updatedVolume = data
    delete updatedVolume.updatedAt
    delete updatedVolume.createdAt
    const originalVolume = volume.toJSON({ transformToUpdateRequestFormat: true })

    await this.updateRequestService.createUpdateRequest(
      {
        entityType: EntityType.LightNovelVolume,
        entityId: volume._id as Types.ObjectId,
        title: 'LightNovelVolume 更新请求',
        description: `更新 LightNovelVolume 条目: ${volume.name}`,
        requestedBy: new Types.ObjectId(req.user._id),
        changes: {
          previous: originalVolume,
          updated: updatedVolume,
          changedFields: Object.keys(updatedVolume),
        },
      },
      req,
    )

    return {
      original: originalVolume,
      updated: updatedVolume,
    }
  }
}
