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
import { VersionService } from '../services/version.service'

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly versionService: VersionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    if (context.switchToHttp().getRequest().url.includes('health')) {
      return next.handle()
    }
    return next.handle().pipe(
      map(data => {
        const response = context.switchToHttp().getResponse()
        const statusCode = response.statusCode

        if (statusCode === HttpStatus.NO_CONTENT || data === undefined || data === null) {
          return null
        }
        return {
          success: true,
          code: data?.code || statusCode || HttpStatus.OK,
          version: this.versionService.getVersion(),
          message: data.message || '',
          data: data.data,
          cached: data.cached || false,
          timestamp: Date.now(),
        }
      }),
    )
  }
}
