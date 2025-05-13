import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from '../controllers/app.controller'

@Module({
  imports: [ConfigModule],
  controllers: [AppController],
  providers: [],
})
export class RootAppModule {}
