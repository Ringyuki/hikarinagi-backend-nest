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
      requestedBy: new Types.ObjectId(req.user._id),
      status: 'pending',
    })
    if (exisitedRequest) {
      throw new BadRequestException('You have a pending update request for this item')
    }

    const updatedVolume = data
    delete updatedVolume.updatedAt
    delete updatedVolume.createdAt
    const originalVolume = volume.toJSON({ transformToUpdateRequestFormat: true })

    await this.updateRequestService.createUpdateRequest({
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
    })

    return {
      original: originalVolume,
      updated: updatedVolume,
    }
  }
}
