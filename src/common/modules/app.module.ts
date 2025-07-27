import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from '../controllers/app.controller'
import { VersionService } from '../services/version.service'

@Module({
  imports: [ConfigModule],
  controllers: [AppController],
  providers: [VersionService],
})
export class RootAppModule {}
