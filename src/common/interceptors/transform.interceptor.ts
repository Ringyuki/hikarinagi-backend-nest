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
    if (context.switchToHttp().getRequest().url.includes('health')) {
      return next.handle()
    }
    return next.handle().pipe(
      map(data => {
        return {
          success: true,
          code: data.code || HttpStatus.OK,
          version: 'v2 dev',
          message: data.message || '',
          data: data.data,
          cached: data.cached || false,
          timestamp: Date.now(),
        }
      }),
    )
  }
}
