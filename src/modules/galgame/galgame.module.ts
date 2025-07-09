import { Module } from '@nestjs/common'
import { GalgameService } from './services/galgame.service'
import { GalgameController } from './controllers/galgame.controller'
import { Galgame, GalgameSchema } from './schemas/galgame.schema'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
  imports: [MongooseModule.forFeature([{ name: Galgame.name, schema: GalgameSchema }])],
  controllers: [GalgameController],
  providers: [GalgameService],
})
export class GalgameModule {}
