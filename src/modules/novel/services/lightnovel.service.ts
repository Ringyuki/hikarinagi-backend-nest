import { Model } from 'mongoose'
import { LightNovel, LightNovelDocument } from '../schemas/light-novel.schema'
import { EditHistoryService } from '../../../common/services/edit-history.service'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { GetLightNovelListDto } from '../dto/get-lightnovel-list.dto'
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface'
import { RequestWithUser } from '../../../modules/auth/interfaces/request-with-user.interface'
import { Types } from 'mongoose'

@Injectable()
export class LightNovelService {
  constructor(
    @InjectModel(LightNovel.name) private lightNovelModel: Model<LightNovelDocument>,
    private readonly editHistoryService: EditHistoryService,
  ) {}

  async findById(id: string) {
    if (isNaN(Number(id))) {
      throw new BadRequestException('id must be a number')
    }

    const novel = await this.lightNovelModel
      .findOneAndUpdate(
        { novelId: id },
        { $inc: { views: 1 } },
        {
          timestamps: false,
        },
      )
      .where('status')
      .equals('published')
      .select('-__v')
      .populate('creator.userId', 'name avatar userId -_id')
      .populate('author', 'name id transName -_id')
      .populate('illustrators.illustrator', 'name id transName -_id')
      .populate('publishers.publisher', 'name id transName -_id')
      .populate('bunko', 'name id transName -_id')
      .populate('characters.character', 'name id transName image -_id')
      .populate('tags.tag', 'name aliases -_id')
      .populate({
        path: 'series.volumes',
        model: 'LightNovelVolume',
        match: { status: 'published' },
        select:
          'volumeId name volumeNumber volumeExtraName volumeType publicationDate status -_id cover',
        options: { sort: { publicationDate: 1 } }, // 按出版日期升序排列
      })

    if (!novel) {
      throw new NotFoundException('Light novel not found')
    }

    const { contributors, createdBy, lastEditBy } = await this.editHistoryService.getContributors(
      'lightNovel',
      novel.novelId,
    )

    return {
      ...novel.toJSON(),
      contributors,
      createdBy,
      lastEditBy,
    }
  }

  async getLightNovelList(
    req: RequestWithUser,
    query: GetLightNovelListDto,
  ): Promise<PaginatedResult<any>> {
    const { page, limit, year, month, sortField, sortOrder, tagsField, bunkoField } = query

    const matchStage: any = {
      status: 'published',
    }
    let nsfw = false
    const { user } = req
    if (user && user.userSetting) {
      nsfw = user.userSetting.showNSFWContent
    }
    if (!nsfw) {
      matchStage.nsfw = { $ne: true }
    }

    // 标签过滤
    const tagsMatch = {}
    if (tagsField) {
      if (Array.isArray(tagsField) && tagsField.length > 0) {
        const tagIds = tagsField.map(tag => new Types.ObjectId(String(tag)))
        tagsMatch['tags.tag'] = { $in: tagIds }
      } else if (typeof tagsField === 'string') {
        tagsMatch['tags.tag'] = new Types.ObjectId(tagsField as string)
      }
    }

    // 文库过滤
    const bunkoMatch: any = {}
    if (bunkoField) {
      if (Array.isArray(bunkoField) && bunkoField.length > 0) {
        const bunkoIds = bunkoField.map(bunko => new Types.ObjectId(String(bunko)))
        bunkoMatch.bunko = { $in: bunkoIds }
      } else if (typeof bunkoField === 'string') {
        bunkoMatch.bunko = new Types.ObjectId(bunkoField as string)
      }
    }

    // 构建基础聚合管道
    const aggregationPipeline: any = [
      { $match: matchStage },
      ...(Object.keys(tagsMatch).length > 0 ? [{ $match: tagsMatch }] : []),
      ...(Object.keys(bunkoMatch).length > 0 ? [{ $match: bunkoMatch }] : []),

      // 关联轻小说卷数据，获取每本小说的卷信息
      {
        $lookup: {
          from: 'lightnovelvolumes',
          let: { seriesId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$seriesId', '$$seriesId'] }, { $eq: ['$status', 'published'] }],
                },
              },
            },
            { $sort: { publicationDate: 1 } }, // 按发布日期升序排序，获取最早的卷
            { $limit: 1 }, // 只取第一卷
          ],
          as: 'volumes',
        },
      },

      // 添加计算字段：使用第一卷的publicationDate作为小说的发布日期
      {
        $addFields: {
          firstVolumePublicationDate: {
            $cond: {
              if: { $gt: [{ $size: '$volumes' }, 0] },
              then: { $arrayElemAt: ['$volumes.publicationDate', 0] },
              else: null,
            },
          },
        },
      },
    ]

    if (year) {
      // 处理日期
      const dateRangeConditions = []
      if (month) {
        // 为每个年月组合创建日期范围
        for (const yearNum of year) {
          for (const monthNum of month) {
            const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`
            const startDateStr = `${yearNum}-${monthStr}-01`
            const lastDay = new Date(yearNum, monthNum, 0).getDate()
            const endDateStr = `${yearNum}-${monthStr}-${lastDay}`

            dateRangeConditions.push({
              $and: [
                { firstVolumePublicationDate: { $gte: startDateStr } },
                { firstVolumePublicationDate: { $lte: endDateStr } },
              ],
            })
          }
        }
      } else {
        // 如果没有提供month参数，为每一年创建一个日期范围
        for (const yearNum of year) {
          const startDateStr = `${yearNum}-01-01`
          const endDateStr = `${yearNum}-12-31`
          dateRangeConditions.push({
            $and: [
              { firstVolumePublicationDate: { $gte: startDateStr } },
              { firstVolumePublicationDate: { $lte: endDateStr } },
            ],
          })
        }
      }
      if (dateRangeConditions.length > 0) {
        aggregationPipeline.push({ $match: { $or: dateRangeConditions } })
      }
    }

    // 关联评分数据
    aggregationPipeline.push(
      {
        $lookup: {
          from: 'rates',
          let: { lightNovelId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$from', 'LightNovel'] },
                    { $eq: ['$fromId', '$$lightNovelId'] },
                    { $eq: ['$isDeleted', 'false'] },
                  ],
                },
              },
            },
          ],
          as: 'ratesData',
        },
      },
      // 计算评分统计
      {
        $addFields: {
          rate: {
            $cond: {
              if: { $gt: [{ $size: '$ratesData' }, 0] },
              then: { $avg: '$ratesData.rate' },
              else: null,
            },
          },
          rateCount: { $size: '$ratesData' },
        },
      },
    )

    // 排序条件
    const sortStage: any = {}
    if (sortField) {
      if (sortField === 'publicationDate') {
        sortStage.firstVolumePublicationDate = sortOrder === 'asc' ? 1 : -1
      } else if (sortField === 'views') {
        sortStage.views = sortOrder === 'asc' ? 1 : -1
      } else if (sortField === 'rate') {
        sortStage.rate = sortOrder === 'asc' ? 1 : -1
      } else if (sortField === 'rateCount') {
        sortStage.rateCount = sortOrder === 'asc' ? 1 : -1
      } else if (sortField === 'novelId') {
        sortStage.novelId = sortOrder === 'asc' ? 1 : -1
      }
    }

    // 只有当sortStage包含至少一个排序键时才添加$sort阶段
    if (Object.keys(sortStage).length > 0) {
      // 添加排序
      aggregationPipeline.push({ $sort: sortStage })
    }

    // 完成聚合管道
    aggregationPipeline.push({
      $facet: {
        metadata: [{ $count: 'totalCount' }],
        lightNovels: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: 'people',
              localField: 'author',
              foreignField: '_id',
              as: 'authorDetails',
            },
          },
          {
            $lookup: {
              from: 'producers',
              localField: 'bunko',
              foreignField: '_id',
              as: 'bunkoDetails',
            },
          },
          {
            $lookup: {
              from: 'tags',
              localField: 'tags.tag',
              foreignField: '_id',
              as: 'tagDetails',
            },
          },
          {
            $project: {
              _id: 0,
              novelId: 1,
              name: 1,
              name_cn: 1,
              cover: 1,
              publicationDate: '$firstVolumePublicationDate', // 使用第一卷的发布日期
              views: 1,
              nsfw: 1,
              rate: 1,
              rateCount: 1,
              author: {
                $cond: {
                  if: { $gt: [{ $size: '$authorDetails' }, 0] },
                  then: {
                    id: { $arrayElemAt: ['$authorDetails.id', 0] },
                    name: { $arrayElemAt: ['$authorDetails.name', 0] },
                    transName: { $arrayElemAt: ['$authorDetails.transName', 0] },
                  },
                  else: null,
                },
              },
              bunko: {
                $cond: {
                  if: { $gt: [{ $size: '$bunkoDetails' }, 0] },
                  then: {
                    id: { $arrayElemAt: ['$bunkoDetails.id', 0] },
                    name: { $arrayElemAt: ['$bunkoDetails.name', 0] },
                    transName: { $arrayElemAt: ['$bunkoDetails.transName', 0] },
                  },
                  else: null,
                },
              },
              tags: {
                $map: {
                  input: '$tagDetails',
                  as: 'tag',
                  in: '$$tag.name',
                },
              },
            },
          },
        ],
      },
    })

    const result = await this.lightNovelModel.aggregate(aggregationPipeline)

    const totalCount = result[0].metadata[0]?.totalCount || 0
    const lightNovels = result[0].lightNovels
    const totalPages = Math.ceil(totalCount / limit)

    return {
      items: lightNovels,
      meta: {
        totalItems: totalCount,
        itemCount: lightNovels.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    }
  }
}
