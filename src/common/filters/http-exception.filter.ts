import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Response, Request } from 'express'
import { ApiResponse } from '../interfaces/response.interface'
import { VersionService } from '../services/version.service'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  constructor(private readonly versionService: VersionService) {}

  catch(exception: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status: number
    let message: string

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse() as string | { message: string | string[] }

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object' && exceptionResponse.message) {
        message = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message.join('; ')
          : exceptionResponse.message
      } else {
        message = '请求发生错误'
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = '服务器内部错误'
    }

    const timestamp = Date.now()
    const errorLog = {
      timestamp,
      method: request.method,
      url: request.url,
      status,
      message,
      userAgent: request.get('user-agent'),
      ip: request.ip,
      stack: exception.stack,
      body: request.body,
      params: request.params,
      query: request.query,
    }

    if (status >= 500) {
      this.logger.error('服务器错误', errorLog)
    } else if (status >= 400) {
      // this.logger.warn('客户端错误', errorLog)
    }

    const responseBody: ApiResponse<null> = {
      success: false,
      code: status,
      version: this.versionService.getVersion(),
      message: message || '请求发生错误',
      data: null,
      timestamp,
      // 开发环境返回错误堆栈
      ...(process.env.NODE_ENV === 'development' && {
        // stack: exception.stack,
        path: request.url,
      }),
    }

    response.status(status).json(responseBody)
  }
}
