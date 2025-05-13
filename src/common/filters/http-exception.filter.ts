import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common'
import { Response } from 'express'
import { ApiResponse } from '../interfaces/response.interface'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse() as string | { message: string | string[] }

    let message: string
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse
    } else {
      message = Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message[0]
        : exceptionResponse.message
    }

    const responseBody: ApiResponse<null> = {
      success: false,
      code: status,
      message: message || '请求发生错误',
      data: null,
      timestamp: Date.now(),
    }

    response.status(status).json(responseBody)
  }
}
