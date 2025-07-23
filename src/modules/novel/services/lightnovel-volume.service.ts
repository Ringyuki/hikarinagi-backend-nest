import { Model, Types } from 'mongoose'
import { LightNovel, LightNovelDocument } from '../schemas/light-novel.schema'
import { LightNovelVolume, LightNovelVolumeDocument } from '../schemas/light-novel-volume.schema'
import { EditHistoryService } from '../../../common/services/edit-history.service'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { UpdateVolumeHasEpubDto } from '../dto/update-volume-has-epub.dto'
import { RequestWithUser } from '../../../modules/auth/interfaces/request-with-user.interface'
import { CreateLightNovelVolumeDto } from '../dto/create-lightnovel-volume.dto'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { CounterService } from '../../../modules/shared/services/counter.service'
import { HikariUserGroup } from '../../../modules/auth/enums/hikari-user-group.enum'

@Injectable()
export class LightNovelVolumeService {
  constructor(
    @InjectModel(LightNovelVolume.name)
    private lightNovelVolumeModel: Model<LightNovelVolumeDocument>,
    @InjectModel(LightNovel.name)
    private lightNovelModel: Model<LightNovelDocument>,
    private readonly editHistoryService: EditHistoryService,
    @InjectConnection() private readonly connection: Connection,
    private readonly counterService: CounterService,
  ) {}

  async findById(id: string) {
    if (isNaN(Number(id))) {
      throw new BadRequestException('id must be a number')
    }

    const volume = await this.lightNovelVolumeModel
      .findOneAndUpdate({ volumeId: id }, { $inc: { views: 1 } }, { timestamps: false })
      .where('status')
      .equals('published')
      .populate('seriesId', 'name name_cn novelId')

    if (!volume) {
      throw new NotFoundException('Volume not found')
    }

    const seriesVolumes = await this.lightNovelVolumeModel
      .find({
        seriesId: volume.seriesId._id,
        status: 'published',
      })
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
