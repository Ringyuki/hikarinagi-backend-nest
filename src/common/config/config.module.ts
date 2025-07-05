import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { HikariConfigService } from './config.service'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [HikariConfigService],
  exports: [HikariConfigService],
})
export class HikariConfigModule {}
