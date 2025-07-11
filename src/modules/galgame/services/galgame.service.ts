import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DownloadInfo, Galgame, GalgameDocument } from '../schemas/galgame.schema'
import { GalgameLinks, GalgameLinksDocument } from '../schemas/galgame-links.schema'
import { RequestWithUser } from 'src/modules/auth/interfaces/request-with-user.interface'
import * as mongoose from 'mongoose'
import { GetGalgameListDto } from '../dto/get-galgame-list.dto'
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface'
import * as crypto from 'crypto'
import { HikariConfigService } from '../../../common/config/services/config.service'
import { Article, ArticleDocument } from '../../content/schemas/article.schema'
import { Post, PostDocument } from '../../content/schemas/post.schema'

@Injectable()
export class GalgameService {
  constructor(
    @InjectModel(Galgame.name) private galgameModel: Model<GalgameDocument>,
    @InjectModel(GalgameLinks.name) private galgameLinksModel: Model<GalgameLinksDocument>,
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private readonly hikariConfigService: HikariConfigService,
  ) {}

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

  async getDownloadInfo(id: number | string): Promise<DownloadInfo> {
    if (isNaN(Number(id))) {
      throw new BadRequestException('id must be a number')
    }
    const galgame = await this.galgameModel.findOneAndUpdate(
      {
        galId: id,
        status: 'published',
      },
      {
        $inc: {
          'downloadInfo.viewTimes': 1,
        },
      },
      {
        new: true,
        timestamps: false,
      },
    )
    if (!galgame) {
      throw new NotFoundException('galgame not found')
    }
    return galgame.toJSON({ onlyDownloadInfo: true }) as unknown as DownloadInfo
  }

  async getDownloadAuthInfo(id: number, timestamp: number, req: RequestWithUser) {
    const { user } = req
    const user_id = user._id

    const message = `${id}-${user_id}-${timestamp}`
    const secret = this.hikariConfigService.get('galDownload.downloadSignatureSecret')
    const signature = crypto.createHmac('sha256', secret).update(message).digest('hex')

    await this.galgameModel.updateOne(
      {
        galId: String(id),
      },
      { $inc: { 'downloadInfo.downloadTimes': 1 } },
    )

    return {
      signature,
    }
  }

  async getGameLinks(id: number | string) {
    if (isNaN(Number(id))) {
      throw new BadRequestException('id must be a number')
    }

    const galgame = await this.galgameModel.findOne({
      galId: String(id),
      status: 'published',
    })
    if (!galgame) {
      throw new NotFoundException('galgame not found')
    }

    const links = await this.galgameLinksModel
      .find({
        galId: galgame._id,
      })
      .populate('userId', 'name avatar userId')

    if (!links || links.length === 0) {
      return []
    }

    const transformedLinks = links.map(linkDoc => {
      const linkDetails = linkDoc.linkDetail.map(detail => {
        const metaObj = {}
        detail.link_meta.forEach(meta => {
          metaObj[meta.key] = meta.value
        })

        return {
          id: detail._id,
          link: detail.link,
          note: detail.note,
          createdAt: detail.createdAt,
          ...metaObj,
        }
      })

      return {
        userId: linkDoc.userId,
        linkType: linkDoc.linkType,
        links: linkDetails,
      }
    })

    const groupedLinks = {
      officialLinks: transformedLinks.filter(l => l.linkType === 'official-link'),
      downloadLinks: transformedLinks.filter(l => l.linkType === 'download-link'),
    }

    return groupedLinks
  }

  async getRelatedGalgames(id: number | string, req: RequestWithUser) {
    if (isNaN(Number(id))) {
      throw new BadRequestException('id must be a number')
    }

    const { user } = req
    let showNSFW: boolean
    if (user && user.userSetting) {
      showNSFW = user.userSetting.showNSFWContent
    } else showNSFW = false

    const nsfwFilter = showNSFW ? {} : { nsfw: false }

    const galgame = await this.galgameModel
      .findOne({ galId: String(id) })
      .where('status')
      .equals('published')
      .select('_id galId nsfw')
      .populate({
        path: 'producers.producer',
        select: 'name',
      })
      .populate({
        path: 'tags.tag',
        select: 'name',
      })
      .populate({
        path: 'characters.character',
        select: 'name',
      })
      .populate({
        path: 'staffs.person',
        select: 'name',
      })
      .lean()
    if (!galgame) {
      throw new NotFoundException('galgame not found')
    }

    const gal_id = galgame._id
    // const galProducers = galgame.producers.map(producer => producer.producer._id)
    const galTags = galgame.tags.map(tag => tag.tag._id)
    const galCharacters = galgame.characters.map(character => character.character._id)
    const galStaffs = galgame.staffs.map(staff => staff.person._id)
    // 获取相关gal

    const relatedGalgames = []

    // const relatedByProcucers = await Galgame.find({
    //   'producers.producer': { $in: galProducers },
    //   _id: { $ne: gal_id }
    // }).where('status').equals('published').select('galId cover transTitle originTitle')
    // relatedGalgames.push(...relatedByProcucers)
    // 至少有3个tag相同
    const relatedByTags = await this.galgameModel.aggregate([
      {
        $match: {
          _id: { $ne: gal_id },
          status: 'published',
          'tags.tag': { $in: galTags },
          ...nsfwFilter,
        },
      },
      {
        $project: {
          galId: 1,
          cover: 1,
          transTitle: 1,
          originTitle: 1,
          nsfw: 1,
          matchingTagsCount: {
            $size: {
              $filter: {
                input: '$tags',
                as: 'tag',
                cond: { $in: ['$$tag.tag', galTags] },
              },
            },
          },
        },
      },
      { $match: { matchingTagsCount: { $gte: 5 } } },
    ])
    relatedGalgames.push(...relatedByTags)
    // 至少有1个角色相同
    const relatedByCharacters = await this.galgameModel.aggregate([
      {
        $match: {
          _id: { $ne: gal_id },
          status: 'published',
          'characters.character': { $in: galCharacters },
          ...nsfwFilter,
        },
      },
      {
        $project: {
          galId: 1,
          cover: 1,
          transTitle: 1,
          originTitle: 1,
          nsfw: 1,
          matchingCharactersCount: {
            $size: {
              $filter: {
                input: '$characters',
                as: 'character',
                cond: { $in: ['$$character.character', galCharacters] },
              },
            },
          },
        },
      },
      { $match: { matchingCharactersCount: { $gte: 1 } } },
    ])
    relatedGalgames.push(...relatedByCharacters)
    // 至少有1个staff相同
    const relatedByStaffs = await this.galgameModel.aggregate([
      {
        $match: {
          _id: { $ne: gal_id },
          status: 'published',
          'staffs.person': { $in: galStaffs },
          ...nsfwFilter,
        },
      },
      {
        $project: {
          galId: 1,
          cover: 1,
          transTitle: 1,
          originTitle: 1,
          nsfw: 1,
          matchingStaffsCount: {
            $size: {
              $filter: {
                input: '$staffs',
                as: 'staff',
                cond: { $in: ['$$staff.person', galStaffs] },
              },
            },
          },
        },
      },
      { $match: { matchingStaffsCount: { $gte: 1 } } },
    ])
    relatedGalgames.push(...relatedByStaffs)

    const scoreMap = {
      matchingTagsCount: 1,
      matchingCharactersCount: 10,
      matchingStaffsCount: 5,
    }
    // 计算分数
    const scoredGalgames = relatedGalgames.map(galgame => {
      const score = Object.keys(scoreMap).reduce((total, key) => {
        return total + (galgame[key] || 0) * scoreMap[key]
      }, 0)
      return { ...galgame, score }
    })
    // 按照分数排序
    scoredGalgames.sort((a, b) => b.score - a.score)
    // 去重
    const uniqueGalgames = new Map()
    scoredGalgames.forEach(galgame => {
      if (!uniqueGalgames.has(galgame.galId)) {
        uniqueGalgames.set(galgame.galId, galgame)
      }
    })
    let filteredRelatedGalgames = Array.from(uniqueGalgames.values()).map(galgame => {
      return {
        galId: galgame.galId,
        cover: galgame.cover,
        transTitle: galgame.transTitle,
        originTitle: galgame.originTitle,
        nsfw: galgame.nsfw,
        score: galgame.score,
      }
    })
    // 过滤掉当前游戏, 保留12个
    filteredRelatedGalgames = filteredRelatedGalgames
      .filter(galgame => galgame.galId !== String(id))
      .slice(0, 32)

    // 获取相关的文章
    let relatedAriticles = []
    const directedRelatedArticles = await this.articleModel
      .find({ 'relatedWorks.workId': gal_id })
      .where('status')
      .equals('published')
      .where('visible')
      .equals('public')
      .where('isReview')
      .equals(false)
      .populate('creator.userId', 'name avatar userId -_id')
      .select('id title cover content createdAt updatedAt')
      .lean()

    relatedAriticles.push(...directedRelatedArticles)

    const targetWorkId = new mongoose.Types.ObjectId(String(gal_id))
    const sectionRelatedArticles = await this.articleModel.aggregate([
      {
        $match: {
          status: 'published',
          visible: 'public',
          sections: { $exists: true, $ne: [] },
        },
      },
      {
        $lookup: {
          from: 'sections',
          localField: 'sections',
          foreignField: '_id',
          as: 'joinedSections',
        },
      },
      {
        $unwind: {
          path: '$joinedSections',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          'joinedSections.relatedWork.workId': targetWorkId,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'creator.userId',
          foreignField: '_id',
          as: 'creatorData',
        },
      },
      {
        $unwind: {
          path: '$creatorData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          id: 1,
          title: 1,
          cover: 1,
          content: 1,
          creator: {
            userId: {
              userId: '$creatorData.userId',
              name: '$creatorData.name',
              avatar: '$creatorData.avatar',
            },
          },
          createdAt: 1,
          updatedAt: 1,
          sectionTitle: '$joinedSections.title',
        },
      },
    ])
    relatedAriticles.push(...sectionRelatedArticles)
    // 去重
    const uniqueArticles = new Map()
    relatedAriticles.forEach(article => {
      if (!uniqueArticles.has(article.id)) {
        uniqueArticles.set(article.id, article)
      }
    })
    relatedAriticles = Array.from(uniqueArticles.values()).map(article => {
      return {
        id: article.id,
        title: article.title,
        cover: article.cover,
        content: article.content.slice(0, 1000),
        creator: article.creator,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      }
    })

    if (relatedAriticles.length) {
      relatedAriticles = relatedAriticles.map(article => {
        article.creator = article.creator.userId
        return {
          id: article.id,
          title: article.title,
          cover: article.cover,
          content: article.content.slice(0, 1000),
          creator: article.creator,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
        }
      })
    }

    return {
      relatedGalgames: filteredRelatedGalgames,
      relatedAriticles: relatedAriticles,
    }
  }
}
