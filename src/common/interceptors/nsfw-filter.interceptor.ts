import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Reflector } from '@nestjs/core'
import { DISABLE_NSFW_FILTER_KEY } from '../../modules/auth/decorators/disable-nsfw-filter.decorator'

@Injectable()
export class NSFWFilterInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 检查是否禁用了NSFW过滤
    const isFilterDisabled = this.reflector.getAllAndOverride<boolean>(DISABLE_NSFW_FILTER_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isFilterDisabled) {
      return next.handle()
    }

    return next.handle().pipe(
      map(data => {
        const request = context.switchToHttp().getRequest()
        const user = request.user
        // 如果用户未登录或未允许显示NSFW内容，过滤NSFW数据
        const canViewNSFW = user?.userSetting?.showNSFWContent === true
        if (!canViewNSFW) {
          return this.filterNSFWContent(data)
        }
        return data
      }),
    )
  }

  private filterNSFWContent(data: any): any {
    if (!data) return data
    // 如果是数组，过滤掉NSFW项目
    if (Array.isArray(data)) {
      return data.filter(item => !item?.nsfw)
    }
    // 如果是对象
    if (typeof data === 'object') {
      // 检查是否为分页结果格式 (PaginatedResult)
      if (data.items && Array.isArray(data.items) && data.meta) {
        const filteredItems = data.items.filter((item: any) => !item?.nsfw)
        const filteredCount = filteredItems.length
        return {
          ...data,
          items: filteredItems,
          meta: {
            ...data.meta,
            totalItems: data.meta.totalItems - (data.items.length - filteredCount),
            itemCount: filteredCount,
            // 重新计算总页数
            totalPages: Math.ceil(
              (data.meta.totalItems - (data.items.length - filteredCount)) / data.meta.itemsPerPage,
            ),
          },
        }
      }
      // 如果是单个对象且标记为NSFW，返回null
      if (data.nsfw === true) {
        return null
      }
      // 递归过滤对象中的NSFW内容
      const filtered = { ...data }
      Object.keys(filtered).forEach(key => {
        if (typeof filtered[key] === 'object' && filtered[key] !== null) {
          filtered[key] = this.filterNSFWContent(filtered[key])
        }
      })
      return filtered
    }

    return data
  }
}
