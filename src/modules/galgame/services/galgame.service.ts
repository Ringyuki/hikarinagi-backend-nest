import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Galgame, GalgameDocument } from '../schemas/galgame.schema'
import { RequestWithUser } from 'src/modules/auth/interfaces/request-with-user.interface'
import * as mongoose from 'mongoose'
import { GetGalgameListDto } from '../dto/get-galgame-list.dto'
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface'

@Injectable()
export class GalgameService {
  constructor(@InjectModel(Galgame.name) private galgameModel: Model<GalgameDocument>) {}

  async findById(id: number | string) {
    if (isNaN(Number(id))) {
      throw new BadRequestException('id must be a number')
    }
    const galgame = await this.galgameModel
      .findOneAndUpdate(
        {
          galId: id,
          status: 'published',
        },
        { $inc: { views: 1 } },
        {
          timestamps: false,
        },
      )
      .populate('creator.userId', 'name avatar userId -_id')
      .populate({
        path: 'producers.producer',
        select: 'id name aliases -_id',
      })
      .populate('tags.tag', 'name aliases -_id')
      .populate({
        path: 'staffs.person',
        select: 'id name transName -_id',
      })
      .populate({
        path: 'characters.character',
        select: 'id name transName intro transIntro image -_id',
        populate: {
          path: 'actors',
          select: 'id name transName -_id',
        },
      })
    if (!galgame) {
      throw new NotFoundException('galgame not found')
    }
    return galgame
  }

  async getGalgameList(
    req: RequestWithUser,
    query: GetGalgameListDto,
  ): Promise<PaginatedResult<any>> {
    const { page, limit, year, month, sortField, sortOrder, tagsField } = query

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
    if (month && !year) {
      throw new BadRequestException('month must be used with year')
    }

    if (year?.length) {
      const dateRangeConditions = []

      if (month?.length) {
        // 验证月份范围（DTO层没有验证范围，这里补充业务验证）
        const validMonths = month.filter(m => m >= 1 && m <= 12)
        if (validMonths.length === 0) {
          throw new BadRequestException('month must be between 1 and 12')
        }

        // 为每个年月组合创建日期范围
        for (const yearNumber of year) {
          for (const monthNumber of validMonths) {
            const monthStr = monthNumber.toString().padStart(2, '0')
            const startDateStr = `${yearNumber}-${monthStr}-01`
            const lastDay = new Date(yearNumber, monthNumber, 0).getDate()
            const endDateStr = `${yearNumber}-${monthStr}-${lastDay.toString().padStart(2, '0')}`

            dateRangeConditions.push({
              $and: [
                { releaseDate: { $gte: startDateStr } },
                { releaseDate: { $lte: endDateStr } },
              ],
            })
          }
        }
      } else {
        // 只有年份，创建整年范围
        for (const yearNumber of year) {
          dateRangeConditions.push({
            $and: [
              { releaseDate: { $gte: `${yearNumber}-01-01` } },
              { releaseDate: { $lte: `${yearNumber}-12-31` } },
            ],
          })
        }
      }

      if (dateRangeConditions.length > 0) {
        matchStage.$or = dateRangeConditions
      }
    }

    // 处理标签
    const tagsMatch = {}
    if (tagsField) {
      if (Array.isArray(tagsField) && tagsField.length > 0) {
        const tagIds = tagsField.map(tag => new mongoose.Types.ObjectId(String(tag)))
        tagsMatch['tags.tag'] = { $in: tagIds }
      } else if (typeof tagsField === 'string') {
        tagsMatch['tags.tag'] = new mongoose.Types.ObjectId(tagsField)
      }
    }

    const sortStage: any = {}
    if (sortField) {
      if (sortField === 'releaseDate') {
        sortStage.releaseDate = sortOrder === 'asc' ? 1 : -1
      } else if (sortField === 'views') {
        sortStage.views = sortOrder === 'asc' ? 1 : -1
      } else if (sortField === 'rate') {
        sortStage.rate = sortOrder === 'asc' ? 1 : -1
      } else if (sortField === 'rateCount') {
        sortStage.rateCount = sortOrder === 'asc' ? 1 : -1
      }
    } else {
      sortStage.releaseDate = -1
    }

    const aggregationPipeline = [
      { $match: matchStage },
      ...(Object.keys(tagsMatch).length > 0 ? [{ $match: tagsMatch }] : []),
      // 关联评分数据
      {
        $lookup: {
          from: 'rates',
          let: { galgameId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$from', 'Galgame'] },
                    { $eq: ['$fromId', '$$galgameId'] },
                    { $eq: ['$isDeleted', false] },
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
      // 应用排序
      { $sort: sortStage },
      {
        $facet: {
          metadata: [{ $count: 'totalCount' }],
          galgames: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $lookup: {
                from: 'producers',
                localField: 'producers.producer',
                foreignField: '_id',
                as: 'producerDetails',
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
                galId: 1,
                transTitle: 1,
                originTitle: 1,
                cover: 1,
                releaseDate: 1,
                views: 1,
                nsfw: 1,
                rate: 1,
                rateCount: 1,
                producers: {
                  $map: {
                    input: '$producerDetails',
                    as: 'producer',
                    in: {
                      producer: {
                        id: '$$producer.id',
                        name: '$$producer.name',
                        aliases: '$$producer.aliases',
                        logo: '$$producer.logo',
                      },
                    },
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
      },
    ]

    const result = await this.galgameModel.aggregate(aggregationPipeline)

    const totalCount = result[0].metadata[0]?.totalCount || 0
    const galgames = result[0].galgames
    const totalPages = Math.ceil(totalCount / limit)

    return {
      items: galgames,
      meta: {
        totalItems: totalCount,
        itemCount: galgames.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    }
  }
}
