import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common'
import { UserSearchService } from '../services/user-search.service'

@Controller('users')
export class UserSearchController {
  constructor(private readonly userSearchService: UserSearchService) {}

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const paginatedUsers = await this.userSearchService.findAll(page, limit)
    return {
      data: paginatedUsers,
      message: '用户列表获取成功',
    }
  }

  @Get('search')
  async searchUsers(
    @Query('keyword') keyword: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (!keyword) {
      return this.findAll(page, limit)
    }

    const searchResults = await this.userSearchService.searchUsers(keyword, page, limit)
    return {
      data: searchResults,
      message: `搜索用户成功：${keyword}`,
    }
  }
}
