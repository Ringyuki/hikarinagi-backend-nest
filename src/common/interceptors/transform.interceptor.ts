import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ApiResponse } from '../interfaces/response.interface'

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest()
    const path = request.url

    return next.handle().pipe(
      map(data => {
        // 处理不同情况的响应数据格式化
        if (
          data &&
          Object.prototype.hasOwnProperty.call(data, 'data') &&
          Object.prototype.hasOwnProperty.call(data, 'message')
        ) {
          // 如果响应已经包含标准字段，就保留这些字段
          return {
            success: true,
            code: data.code || HttpStatus.OK,
            message: data.message || '操作成功',
            data: data.data,
            timestamp: Date.now(),
            path,
          }
        }

        // 将普通响应数据包装为标准格式
        return {
          success: true,
          code: HttpStatus.OK,
          message: '操作成功',
          data,
          timestamp: Date.now(),
          path,
        }
      }),
    )
  }
}
