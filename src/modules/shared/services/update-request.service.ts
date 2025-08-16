import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { UpdateRequest, UpdateRequestDocument } from '../schemas/update-request.schema'
import { Model, Types } from 'mongoose'
import { CreateUpdateRequestDto, EntityType } from '../dto/create-update-request.dto'
import { GetUpdateRequestsDto } from '../dto/get-update-requests.dto'
import { ProcessUpdateRequestDto } from '../dto/process-update-request.dto'
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface'
import { UpdateRequestMergeService } from './update-request-merge.service'
import { RequestWithUser } from '../../../modules/auth/interfaces/request-with-user.interface'
import { GetUpdateRequestsByEntityParamsDto } from '../dto/get-update-requests-by-entity-params.dto'
import { User, UserDocument } from '../../user/schemas/user.schema'
import { SystemMessageService } from '../../message/services/system-message.service'
import { SystemMessageType } from '../../message/dto/send-system-message.dto'
import { Person, PersonDocument } from '../../entities/schemas/person.schema'
import { Producer, ProducerDocument } from '../../entities/schemas/producer.schema'
import { Character, CharacterDocument } from '../../entities/schemas/character.schema'
import { Tag, TagDocument } from '../../entities/schemas/tag.schema'

@Injectable()
export class UpdateRequestService {
  constructor(
    @InjectModel(UpdateRequest.name)
    private updateRequestModel: Model<UpdateRequestDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Person.name)
    private personModel: Model<PersonDocument>,
    @InjectModel(Producer.name)
    private producerModel: Model<ProducerDocument>,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    @InjectModel(Tag.name)
    private tagModel: Model<TagDocument>,
    private updateRequestMergeService: UpdateRequestMergeService,
    private systemMessageService: SystemMessageService,
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

  async createUpdateRequest(createUpdateRequestDto: CreateUpdateRequestDto, req?: RequestWithUser) {
    const updateRequest = await this.updateRequestModel.create(createUpdateRequestDto)

    const requestUser = await this.userModel.findById(updateRequest.requestedBy)
    // 向作者和管理员发送系统消息
    const receivers: Types.ObjectId[] = []

    const Model = this.getModel(updateRequest.entityType)
    const sharedEntities = ['Person', 'Producer', 'Character']
    let author: Types.ObjectId
    if (sharedEntities.includes(createUpdateRequestDto.entityType)) {
      const entity = await Model.findById(createUpdateRequestDto.entityId)
      author = new Types.ObjectId(entity.creator.userId as string)
    } else {
      const creatorId =
        (createUpdateRequestDto.changes.updated as any).creator?._id ||
        (createUpdateRequestDto.changes.updated as any).creator?.userId
      author = new Types.ObjectId(creatorId as string)
    }
    receivers.push(author)

    const adminUsers = await this.userModel.find({
      hikariUserGroup: { $in: ['admin', 'superAdmin'] },
    })
    receivers.push(...adminUsers.map(user => new Types.ObjectId(user._id.toString())))

    let filteredReceivers = receivers
    if (req.user) {
      const currentUserId = new Types.ObjectId(req.user._id)
      filteredReceivers = receivers.filter(receiver => !receiver.equals(currentUserId))
    }

    for (const receiver of filteredReceivers) {
      await this.systemMessageService.sendSystemMessage({
        targetUser: receiver,
        title: `${createUpdateRequestDto.entityType} 更新请求`,
        type: SystemMessageType.SYSTEM,
        content: `${createUpdateRequestDto.entityType} 条目 ${
          (createUpdateRequestDto.changes.updated as any).transName ||
          (createUpdateRequestDto.changes.updated as any).name ||
          (createUpdateRequestDto.changes.updated as any).transTitle ||
          (createUpdateRequestDto.changes.updated as any).originTitle[0] ||
          (createUpdateRequestDto.changes.updated as any).name_cn ||
          (createUpdateRequestDto.changes.updated as any).name
        } 有更新请求。请前往审核页面查看详情。
        <br>提交用户：${requestUser.name}
        <br>提交时间：${new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}
        `,
      })
    }
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
      query['$or'] = [
        { 'changes.previous.creator._id': new Types.ObjectId(req.user._id) },
        { 'changes.previous.creator.userId': new Types.ObjectId(req.user._id) },
      ]
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
    const { action, rejectionReason } = processUpdateRequestDto
    const processedBy = new Types.ObjectId(req.user._id)

    const updateRequest = await this.updateRequestModel.findById(updateRequestId)
    if (!updateRequest) {
      throw new NotFoundException('Update request not found')
    }
    if (updateRequest.status !== 'pending') {
      throw new BadRequestException('Update request is not pending')
    }

    const Model = this.getModel(updateRequest.entityType)
    let isCreator: boolean
    const sharedEntities = ['Person', 'Producer', 'Character']
    if (sharedEntities.includes(updateRequest.entityType)) {
      const entity = await Model.findById(updateRequest.entityId)
      const creatorUserId = entity.creator.userId.toString()
      const creator_id = entity.creator._id.toString()
      isCreator =
        creatorUserId === req.user._id.toString() || creator_id === req.user._id.toString()
    } else {
      const creatorUserId = (updateRequest.changes.updated as any).creator?.userId?.toString()
      const creator_id = (updateRequest.changes.updated as any).creator?._id?.toString()
      isCreator =
        creatorUserId === req.user._id.toString() || creator_id === req.user._id.toString()
    }

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
      .populate(
        'entityId',
        'galId novelId volumeId id cover image logo transTitle originTitle name name_cn transName',
      )
      .lean()

    requests.forEach(request => {
      ;(request as any).entityInfo = {
        ...request.entityId,
      }
      request.entityId = request.entityId._id
      delete (request as any).entityInfo._id
    })

    requests.forEach(request => {
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

  async getUpdateRequestsByEntity(
    params: GetUpdateRequestsByEntityParamsDto,
  ): Promise<Array<{ _id: Types.ObjectId; createdAt: Date; requestedBy: any }>> {
    const { entityType, entityId } = params
    const requests: any[] = await this.updateRequestModel
      .find({
        entityType,
        entityId: new Types.ObjectId(entityId),
        status: 'merged',
      })
      .select('_id requestedBy createdAt')
      .populate('requestedBy', 'userId name avatar')
      .sort({ createdAt: -1 })
      .lean()
      .exec()
    return requests.map(req => ({
      _id: req._id,
      requestedBy: req.requestedBy,
      createdAt: req.createdAt,
    }))
  }
}
