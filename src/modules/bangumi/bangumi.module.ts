import { Module, Global } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { BangumiAuthService } from './services/bangumi-auth.service'

@Global()
@Module({
  imports: [HttpModule],
  providers: [BangumiAuthService],
  exports: [BangumiAuthService],
})
export class BangumiModule {}
