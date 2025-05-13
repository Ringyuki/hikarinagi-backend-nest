import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User, UserDocument } from '../schemas/user.schema'
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface'

@Injectable()
export class UserSearchService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // 分页查询用户列表
  async findAll(page = 1, limit = 10, query = {}): Promise<PaginatedResult<UserDocument>> {
    const skip = (page - 1) * limit

    const [items, totalItems] = await Promise.all([
      this.userModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .select('userId name avatar hikariUserGroup bio createdAt headCover signature status')
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    }
  }

  // 根据关键字搜索用户
  async searchUsers(keyword: string, page = 1, limit = 10): Promise<PaginatedResult<UserDocument>> {
    const query = {
      $or: [
        { username: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ],
    }

    return this.findAll(page, limit, query)
  }
}
