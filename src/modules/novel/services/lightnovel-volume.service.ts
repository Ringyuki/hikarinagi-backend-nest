import { Model, Types } from 'mongoose'
import * as crypto from 'crypto'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { LightNovel, LightNovelDocument } from '../schemas/light-novel.schema'
import { LightNovelVolume, LightNovelVolumeDocument } from '../schemas/light-novel-volume.schema'
import { EditHistoryService } from '../../../common/services/edit-history.service'
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { UpdateVolumeHasEpubDto } from '../dto/update-volume-has-epub.dto'
import { RequestWithUser } from '../../../modules/auth/interfaces/request-with-user.interface'
import { CreateLightNovelVolumeDto } from '../dto/create-lightnovel-volume.dto'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { CounterService } from '../../../modules/shared/services/counter.service'
import { HikariUserGroup } from '../../../modules/auth/enums/hikari-user-group.enum'
import { HikariConfigService } from '../../../common/config/services/config.service'
import { User, UserDocument } from '../../user/schemas/user.schema'
import { SystemMessageType } from '../../message/dto/send-system-message.dto'
import { SystemMessageService } from '../../message/services/system-message.service'

@Injectable()
export class LightNovelVolumeService {
  private readonly s3Client: S3Client
  constructor(
    @InjectModel(LightNovelVolume.name)
    private lightNovelVolumeModel: Model<LightNovelVolumeDocument>,
    @InjectModel(LightNovel.name)
    private lightNovelModel: Model<LightNovelDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly systemMessageService: SystemMessageService,
    private readonly editHistoryService: EditHistoryService,
    @InjectConnection() private readonly connection: Connection,
    private readonly counterService: CounterService,
    private readonly configService: HikariConfigService,
  ) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: this.configService.get('r2.r2Endpoint'),
      credentials: {
        accessKeyId: this.configService.get('r2.novel.r2LightNovelAccessKey'),
        secretAccessKey: this.configService.get('r2.novel.r2LightNovelSecretKey'),
      },
    })
  }

  async findById(id: string, req: RequestWithUser, preview: boolean = false) {
    if (isNaN(Number(id))) {
      throw new BadRequestException('id must be a number')
    }

    const query: any = {
      volumeId: id,
      status: 'published',
    }
    if (
      [HikariUserGroup.ADMIN, HikariUserGroup.SUPER_ADMIN].includes(req.user?.hikariUserGroup) &&
      preview
    ) {
      delete query.status
    }

    const volume = await this.lightNovelVolumeModel
      .findOneAndUpdate(query, { $inc: { views: 1 } }, { timestamps: false })
      .populate('seriesId', 'name name_cn novelId')

    if (!volume) {
      throw new NotFoundException('Volume not found')
    }

    const seriesQuery: any = {
      seriesId: volume.seriesId._id,
      status: 'published',
    }
    if (
      [HikariUserGroup.ADMIN, HikariUserGroup.SUPER_ADMIN].includes(req.user?.hikariUserGroup) &&
      preview
    ) {
      delete seriesQuery.status
    }

    const seriesVolumes = await this.lightNovelVolumeModel
      .find(seriesQuery)
      .select('volumeId volumeNumber volumeType publicationDate')
      .sort({ publicationDate: 1 }) // 按出版日期升序排列
      .lean()

    // 查找当前卷在系列中的位置
    const currentIndex = seriesVolumes.findIndex(vol => vol.volumeId === parseInt(id))

    // 确定上一卷和下一卷
    const prevVolume = currentIndex > 0 ? seriesVolumes[currentIndex - 1].volumeId : null
    const nextVolume =
      currentIndex < seriesVolumes.length - 1 ? seriesVolumes[currentIndex + 1].volumeId : null

    const { contributors, createdBy, lastEditBy } = await this.editHistoryService.getContributors(
      'LightNovelVolume',
      volume.volumeId,
    )

    return {
      ...volume.toJSON(),
      seriesId: volume.toJSON().seriesId,
      novelId: (volume.toJSON().seriesId as any).novelId,
      prevVolume,
      nextVolume,
      contributors,
      createdBy,
      lastEditBy,
    }
  }

  async createLightNovelVolume(
    createLightNovelVolumeDto: CreateLightNovelVolumeDto,
    req: RequestWithUser,
  ) {
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      const volumeId = await this.counterService.getNextSequence('volumeId')
      const novel = await this.lightNovelModel.findOne({
        novelId: createLightNovelVolumeDto.novelId,
      })

      const volume = await this.lightNovelVolumeModel.create(
        [
          {
            ...createLightNovelVolumeDto,
            volumeId,
            seriesId: novel._id,
            status: req.user.hikariUserGroup === HikariUserGroup.CREATOR ? 'pending' : 'published',
            creator: {
              userId: new Types.ObjectId(req.user._id),
              name: req.user.name,
            },
          },
        ],
        { session },
      )

      await this.lightNovelModel.findByIdAndUpdate(
        novel._id,
        {
          $push: { 'series.volumes': volume[0]._id },
        },
        { new: true, session },
      )

      if (volume[0].status === 'pending') {
        const adminUsers = await this.userModel.find({
          hikariUserGroup: { $in: [HikariUserGroup.ADMIN, HikariUserGroup.SUPER_ADMIN] },
        })
        const adminUserIds = adminUsers.map(user => user._id)
        for (const adminUserId of adminUserIds) {
          await this.systemMessageService.sendSystemMessage({
            targetUser: new Types.ObjectId(adminUserId.toString()),
            title: '新轻小说分卷等待审核',
            content: `新轻小说分卷 ${volume[0].name_cn || volume[0].name} 等待审核`,
            type: SystemMessageType.SYSTEM,
            link: `/lightnovel/volumes/${volume[0].volumeId}?preview=true`,
            linkText: '预览轻小说分卷',
          })
        }
      }

      await this.editHistoryService.recordEditHistory({
        type: 'LightNovelVolume',
        actionType: 'create',
        volumeId: volumeId.toString(),
        userId: new Types.ObjectId(req.user._id),
        userName: req.user.name,
        changes: '创建了轻小说分卷',
        previous: null,
        updated: volume[0].toObject(),
      })

      await session.commitTransaction()
      return {
        volumeId,
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  }

  async generateDownloadSignature(
    volumeId: number,
    novelId: number,
    userId: string,
    timestamp?: number,
  ) {
    if (isNaN(Number(novelId)) || isNaN(Number(volumeId))) {
      throw new BadRequestException('novelId and volumeId must be numbers')
    }

    const _timestamp = timestamp || Date.now()
    const dataToSign = `${novelId}-${volumeId}-${userId}-${_timestamp}`
    const signature = crypto
      .createHmac('sha256', this.configService.get('reader.readerSignatureSecret'))
      .update(dataToSign)
      .digest('hex')

    return { signature, timestamp: _timestamp }
  }

  async generateDownloadUrl(
    novelId: number,
    volumeId: number,
    signature: string,
    timestamp: number,
    req: RequestWithUser,
    readOnline?: boolean,
  ) {
    if (!signature || !timestamp) {
      throw new BadRequestException('signature and timestamp are required')
    }
    const now = Date.now()
    const diff = now - timestamp
    if (diff > 1000 * 60 * 5) {
      // 5分钟有效
      throw new BadRequestException('signature is expired')
    }

    const exceptedSignature = await this.generateDownloadSignature(
      volumeId,
      novelId,
      req.user._id.toString(),
      timestamp,
    )

    if (signature !== exceptedSignature.signature) {
      throw new ForbiddenException('signature is invalid')
    }

    const volume = await this.lightNovelVolumeModel
      .findOne({ volumeId })
      .populate('seriesId', 'name')
      .lean()

    if (!volume) {
      throw new NotFoundException('找不到指定的分卷')
    }

    const seriesName = (volume.seriesId as any).name_cn || (volume.seriesId as any).name
    const fileName = `${seriesName} - ${volume.name_cn || volume.name}.epub`

    const filePath = `${novelId}/${volumeId}/${volumeId}.epub`
    const command = new GetObjectCommand({
      Bucket: this.configService.get('r2.novel.r2LightNovelBucket'),
      Key: filePath,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
    })

    const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 }) // 链接5分钟有效

    if (readOnline) {
      await this.lightNovelVolumeModel.findOneAndUpdate(
        { volumeId },
        { $inc: { readTimes: 1 } },
        { timestamps: false },
      )
      await this.lightNovelModel.findOneAndUpdate(
        { novelId },
        { $inc: { readTimes: 1 } },
        { timestamps: false },
      )
    } else {
      await this.lightNovelVolumeModel.findOneAndUpdate(
        { volumeId },
        { $inc: { downloadTimes: 1 } },
        { timestamps: false },
      )
      await this.lightNovelModel.findOneAndUpdate(
        { novelId },
        { $inc: { downloadTimes: 1 } },
        { timestamps: false },
      )
    }

    return { url: signedUrl }
  }

  async updateHasEpub(volumeId: number, { hasEpub }: UpdateVolumeHasEpubDto) {
    const volume = await this.lightNovelVolumeModel.findOneAndUpdate(
      { volumeId },
      { $set: { hasEpub } },
      { new: true },
    )

    if (!volume) {
      throw new NotFoundException('Volume not found')
    }

    return volume
  }
}
