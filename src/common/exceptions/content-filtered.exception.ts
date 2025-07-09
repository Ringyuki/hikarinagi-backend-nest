import { HttpException, HttpStatus } from '@nestjs/common'

export class ContentFilteredException extends HttpException {
  constructor(message: string = 'Content has been filtered due to NSFW restrictions') {
    super(message, HttpStatus.FORBIDDEN)
  }
}
