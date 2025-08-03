import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Galgame, GalgameDocument } from '../../galgame/schemas/galgame.schema'
import { UpdateRequest, UpdateRequestDocument } from '../../shared/schemas/update-request.schema'
import { UpdateRequestService } from '../../shared/services/update-request.service'
import { UpdateGalgameDto } from '../dto/galgame/update-galgame.dto'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
import { EntityType } from '../../shared/dto/create-update-request.dto'

@Injectable()
export class GalgameManagementService {
  constructor(
    @InjectModel(Galgame.name) private galgameModel: Model<GalgameDocument>,
    @InjectModel(UpdateRequest.name) private updateRequestModel: Model<UpdateRequestDocument>,
    private readonly updateRequestService: UpdateRequestService,
  ) {}

  async updateGalgame(galId: string, data: UpdateGalgameDto, req: RequestWithUser) {
    const galgame = await this.galgameModel
      .findOne({ galId })
      .populate('creator.userId')
      .populate('characters.character')
      .populate('staffs.person')
      .populate('producers.producer')
      .populate('tags.tag')
    if (!galgame) {
      throw new NotFoundException('Galgame not found')
    }

    if (galgame.status !== 'published') {
      throw new BadRequestException('Item status must be published to update')
    }

    const exisitedRequest = await this.updateRequestModel.findOne({
      entityId: galgame._id,
      requestedBy: new Types.ObjectId(req.user._id),
      status: 'pending',
    })
    if (exisitedRequest) {
      throw new BadRequestException('You have a pending update request for this item')
    }

    const updatedGalgame = data
    delete updatedGalgame.updatedAt
    delete updatedGalgame.createdAt
    if (updatedGalgame.downloadInfo) {
      delete updatedGalgame.downloadInfo.viewTimes
      delete updatedGalgame.downloadInfo.downloadTimes
    }
    const originalGalgame = galgame.toJSON({ transformToUpdateRequestFormat: true })

    await this.updateRequestService.createUpdateRequest(
      {
        entityType: EntityType.Galgame,
        entityId: galgame._id as Types.ObjectId,
        title: 'Galgame 更新请求',
        description: '更新 Galgame 条目',
        requestedBy: new Types.ObjectId(req.user._id),
        changes: {
          previous: originalGalgame,
          updated: updatedGalgame,
          changedFields: Object.keys(updatedGalgame),
        },
      },
      req,
    )

    return {
      original: originalGalgame,
      updated: updatedGalgame,
    }
  }
}
