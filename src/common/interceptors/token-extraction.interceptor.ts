import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { JwtService } from '@nestjs/jwt'
import { HikariConfigService } from '../config/configs'
import { Request } from 'express'

@Injectable()
export class TokenExtractionInterceptor implements NestInterceptor {
  constructor(
    private jwtService: JwtService,
    private configService: HikariConfigService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>()

    const token = this.extractTokenFromHeader(request) || this.extractTokenFromCookie(request)

    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get('jwt.secret'),
        })

        request['user'] = payload
      } catch {
        /* empty */
      }
    }

    return next.handle()
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    if (request.cookies) {
      if (request.cookies['hikari_access_token']) {
        return request.cookies['hikari_access_token']
      }
    }
    return undefined
  }
}
