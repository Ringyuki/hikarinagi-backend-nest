import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { HikariConfigService } from './services/config.service'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [HikariConfigService],
  exports: [HikariConfigService],
})
export class HikariConfigModule {}
