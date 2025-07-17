import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Galgame, GalgameDocument } from '../schemas/galgame.schema'
import { GalgameLinks, GalgameLinksDocument } from '../schemas/galgame-links.schema'
import { RequestWithUser } from 'src/modules/auth/interfaces/request-with-user.interface'
import { CreateGalgameLinkDto } from '../dto/create-galgame-link.dto'
import { UpdateGalgameLinkDto } from '../dto/update-galgame-link.dto'
import { DeleteGalgameLinkDto } from '../dto/delete-galgame-link.dto'
import { HikariUserGroup } from '../../auth/enums/hikari-user-group.enum'

@Injectable()
export class GalgameLinsService {
  constructor(
    @InjectModel(GalgameLinks.name) private galgameLinksModel: Model<GalgameLinksDocument>,
    @InjectModel(Galgame.name) private galgameModel: Model<GalgameDocument>,
  ) {}

  async getLinks(id: string) {
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

  async createLink(data: CreateGalgameLinkDto, req: RequestWithUser) {
    const { galgame_Id, linkType, ...linkDetail } = data
    const { _id: userId } = req.user

    const galgame = await this.galgameModel.findById(galgame_Id)
    if (!galgame) {
      throw new NotFoundException('galgame not found')
    }

    const link_meta = []

    if (linkType === 'official-link') {
      link_meta.push({
        key: 'platform',
        value: linkDetail.officialLinkPlatform,
      })
    } else {
      link_meta.push(
        { key: 'type', value: linkDetail.downloadType },
        { key: 'size', value: `${linkDetail.size}${linkDetail.sizeFormat}` },
        { key: 'download_type', value: linkDetail.downloadLinkType },
      )

      if (linkDetail.downloadType) {
        link_meta.push({ key: 'language', value: linkDetail.language })
        link_meta.push({ key: 'platform', value: linkDetail.platform })
      }

      if (linkDetail.linkPassword) {
        link_meta.push({ key: 'password', value: linkDetail.linkPassword })
      }
      if (linkDetail.unzipPassword) {
        link_meta.push({ key: 'unzip_password', value: linkDetail.unzipPassword })
      }
    }

    let galgameLinks = await this.galgameLinksModel.findOne({
      galId: galgame._id,
      userId,
      linkType,
    })

    if (!galgameLinks) {
      galgameLinks = new this.galgameLinksModel({
        galId: galgame._id,
        userId,
        linkType,
        linkDetail: [],
      })
    }

    galgameLinks.linkDetail.push({
      link: linkDetail.link,
      link_meta,
      note: linkDetail.note,
      createdAt: new Date(),
    })

    const createdLinks = await galgameLinks.save()
    return createdLinks
  }

  async updateLink(
    galgame_id: string,
    link_id: string,
    data: UpdateGalgameLinkDto,
    req: RequestWithUser,
  ) {
    const { linkType, userId, ...linkDetail } = data
    const link = await this.galgameLinksModel.findOne({
      galId: galgame_id,
      userId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(req.user._id),
      linkType,
    })
    if (!link) {
      throw new NotFoundException('link not found')
    }
    if (
      link.userId.toString() !== req.user._id.toString() &&
      req.user.hikariUserGroup !== HikariUserGroup.ADMIN &&
      req.user.hikariUserGroup !== HikariUserGroup.SUPER_ADMIN
    ) {
      throw new ForbiddenException('you are not allowed to update this link')
    }
    if (link.linkDetail.findIndex(detail => detail._id.toString() === link_id) === -1) {
      throw new NotFoundException('link detail not found')
    }

    const link_meta = []
    if (link.linkType === 'official-link') {
      link_meta.push({
        key: 'platform',
        value: linkDetail.platform,
      })
      link.linkDetail = link.linkDetail.map(detail => {
        if (detail._id.toString() === link_id) {
          return {
            ...detail,
            link: linkDetail.link || detail.link,
            note: linkDetail.note || detail.note,
            link_meta,
          }
        }
        return detail
      })
    } else {
      link_meta.push(
        { key: 'type', value: linkDetail.type || '' },
        { key: 'size', value: linkDetail.size || '' },
        { key: 'download_type', value: linkDetail.download_type || '' },
      )

      if (linkDetail.download_type) {
        link_meta.push({ key: 'language', value: linkDetail.language || '' })
      }

      if (linkDetail.download_type) {
        link_meta.push({ key: 'platform', value: linkDetail.platform || '' })
      }

      if (linkDetail.password) {
        link_meta.push({ key: 'password', value: linkDetail.password || '' })
      }
      if (linkDetail.unzip_password) {
        link_meta.push({ key: 'unzip_password', value: linkDetail.unzip_password || '' })
      }
    }
    link.linkDetail = link.linkDetail.map(detail => {
      if (detail._id.toString() === link_id) {
        return {
          ...detail,
          link: linkDetail.link || detail.link,
          note: linkDetail.note || detail.note,
          link_meta,
        }
      }
      return detail
    })

    const updatedLinks = await link.save()
    return updatedLinks
  }

  async deleteLink(
    galgame_id: string,
    link_id: string,
    data: DeleteGalgameLinkDto,
    req: RequestWithUser,
  ) {
    const { linkType, userId } = data
    const link = await this.galgameLinksModel.findOne({
      galId: galgame_id,
      userId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(req.user._id),
      linkType,
    })
    if (!link) {
      throw new NotFoundException('link not found')
    }
    if (
      link.userId.toString() !== req.user._id.toString() &&
      req.user.hikariUserGroup !== HikariUserGroup.ADMIN &&
      req.user.hikariUserGroup !== HikariUserGroup.SUPER_ADMIN
    ) {
      throw new ForbiddenException('you are not allowed to delete this link')
    }
    if (link.linkDetail.findIndex(detail => detail._id.toString() === link_id) === -1) {
      throw new NotFoundException('link detail not found')
    }
    link.linkDetail = link.linkDetail.filter(detail => detail._id.toString() !== link_id)
    await link.save()
  }
}
