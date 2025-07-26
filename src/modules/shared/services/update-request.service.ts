import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { UpdateRequest, UpdateRequestDocument } from '../schemas/update-request.schema'
import { Model, Types } from 'mongoose'
import { CreateUpdateRequestDto } from '../dto/create-update-request.dto'
import { GetUpdateRequestsDto } from '../dto/get-update-requests.dto'
import { ProcessUpdateRequestDto } from '../dto/process-update-request.dto'
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface'
import { UpdateRequestMergeService } from './update-request-merge.service'
import { RequestWithUser } from '../../../modules/auth/interfaces/request-with-user.interface'

@Injectable()
export class UpdateRequestService {
  constructor(
    @InjectModel(UpdateRequest.name)
    private updateRequestModel: Model<UpdateRequestDocument>,
    private updateRequestMergeService: UpdateRequestMergeService,
  ) {}

  async createUpdateRequest(createUpdateRequestDto: CreateUpdateRequestDto) {
    const updateRequest = await this.updateRequestModel.create(createUpdateRequestDto)
    return updateRequest
  }

  async getUserUpdateRequests(req: RequestWithUser, options: GetUpdateRequestsDto) {
    const requests = await this.getUpdateRequests(options, new Types.ObjectId(req.user._id))
    return requests
  }

  async getUserAuditableUpdateRequests(req: RequestWithUser, options: GetUpdateRequestsDto) {
    const query = {}

    if (
      !req.user.hikariUserGroup.includes('admin') &&
      !req.user.hikariUserGroup.includes('superAdmin')
    ) {
      query['changes.previous.creator.userId'] = new Types.ObjectId(req.user._id)
    }

    const requests = await this.getUpdateRequests(options, new Types.ObjectId(req.user._id), query)
    return requests
  }

  async getUpdateRequestById(updateRequestId: Types.ObjectId) {
    const updateRequest = await this.updateRequestModel
      .findById(updateRequestId)
      .populate('requestedBy', 'userId name avatar')
      .populate('processedBy', 'userId name avatar')
      .lean()

    if (!updateRequest) {
      throw new NotFoundException('Update request not found')
    }

    return updateRequest
  }

  async processUpdateRequest(
    updateRequestId: Types.ObjectId,
    processUpdateRequestDto: ProcessUpdateRequestDto,
    req: RequestWithUser,
  ) {
    const { action, processedBy, rejectionReason } = processUpdateRequestDto
    const updateRequest = await this.updateRequestModel.findById(updateRequestId)
    if (!updateRequest) {
      throw new NotFoundException('Update request not found')
    }
    if (updateRequest.status !== 'pending') {
      throw new BadRequestException('Update request is not pending')
    }

    const isCreator =
      (updateRequest.changes.previous as any).creator.userId.toString() === req.user._id

    if (
      req.user.hikariUserGroup !== 'admin' &&
      req.user.hikariUserGroup !== 'superAdmin' &&
      !isCreator
    ) {
      throw new ForbiddenException('you have no permission to process this update request')
    }

    if (action === 'merge') {
      updateRequest.status = 'merged'
      updateRequest.processedBy = processedBy
      updateRequest.processedAt = new Date()
      updateRequest.rejectionReason = null

      await this.updateRequestMergeService.mergeUpdateRequest({
        requestedBy: updateRequest.requestedBy,
        processedBy,
        itemType: updateRequest.entityType,
        itemId: updateRequest.entityId,
        mergeData: updateRequest.changes.updated,
      })
    } else if (action === 'reject') {
      updateRequest.status = 'rejected'
      updateRequest.processedBy = processedBy
      updateRequest.processedAt = new Date()
      updateRequest.rejectionReason = rejectionReason
    }

    await updateRequest.save()
  }

  private async getUpdateRequests(
    options: GetUpdateRequestsDto,
    userId?: Types.ObjectId,
    _query?: Record<string, any>,
  ): Promise<PaginatedResult<UpdateRequestDocument>> {
    const { status, page, limit, entityType } = options

    const query: any = {}
    if (entityType) {
      query.entityType = entityType
    }
    if (status) {
      query.status = status
    }
    if (userId) {
      query.requestedBy = userId
    }
    if (_query) {
      Object.assign(query, _query)
      delete query.requestedBy
    }

    const total = await this.updateRequestModel.countDocuments(query)
    const requests = await this.updateRequestModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('requestedBy', 'userId name avatar')
      .populate('processedBy', 'userId name avatar')
      .lean()

    requests.forEach(request => {
      delete (request.changes.previous as any)._id
      delete (request.changes.previous as any).__v
      delete (request.changes.previous as any).creator
      delete (request.changes.updated as any).__v
      delete (request.changes.updated as any)._id
      delete (request.changes.updated as any).creator

      delete (request.changes.previous as any).views
      delete (request.changes.updated as any).views
      delete (request.changes.previous as any).novelId
      delete (request.changes.updated as any).novelId
      delete (request.changes.previous as any).galId
      delete (request.changes.updated as any).galId
      delete (request.changes.previous as any).volumeId
      delete (request.changes.updated as any).volumeId
      delete (request.changes.previous as any).id
      delete (request.changes.updated as any).id
    })

    return {
      items: requests,
      meta: {
        totalItems: total,
        itemCount: requests.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    }
  }
}
