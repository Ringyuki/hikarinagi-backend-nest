import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { HikariConfigService } from '../config/configs'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: HikariConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    })
  }

  async validate(payload: any) {
    return {
      _id: payload._id,
      userId: payload.userId,
      name: payload.name,
      email: payload.email,
      hikariUserGroup: payload.hikariUserGroup,
    }
  }
}
