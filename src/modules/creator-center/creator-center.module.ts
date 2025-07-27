import { Module } from '@nestjs/common'
import { GalgameManagementController } from './controllers/galgame-management.controller'
import { GalgameManagementService } from './services/galgame-management.service'
import { Galgame, GalgameSchema } from '../galgame/schemas/galgame.schema'
import { UpdateRequest, UpdateRequestSchema } from '../shared/schemas/update-request.schema'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Galgame.name, schema: GalgameSchema }]),
    MongooseModule.forFeature([{ name: UpdateRequest.name, schema: UpdateRequestSchema }]),
  ],
  controllers: [GalgameManagementController],
  providers: [GalgameManagementService],
})
export class CreatorCenterModule {}
