import { Module } from '@nestjs/common'
import { GalgameManagementController } from './controllers/galgame-management.controller'
import { GalgameManagementService } from './services/galgame-management.service'
import { LightNovelManagementController } from './controllers/lightnovel-management.controller'
import { LightNovelManagementService } from './services/lightnovel-management.service'
import { LightNovelVolumeManagementController } from './controllers/lightnovel-volume-management.controller'
import { LightNovelVolumeManagementService } from './services/lightnovel-volume-management.service'
import { LightNovel, LightNovelSchema } from '../novel/schemas/light-novel.schema'
import { Galgame, GalgameSchema } from '../galgame/schemas/galgame.schema'
import { MongooseModule } from '@nestjs/mongoose'
import { UpdateRequest, UpdateRequestSchema } from '../shared/schemas/update-request.schema'
import {
  LightNovelVolume,
  LightNovelVolumeSchema,
} from '../novel/schemas/light-novel-volume.schema'
import { Person, PersonSchema } from '../entities/schemas/person.schema'
import { Producer, ProducerSchema } from '../entities/schemas/producer.schema'
import { Character, CharacterSchema } from '../entities/schemas/character.schema'
import { Tag, TagSchema } from '../entities/schemas/tag.schema'
import { EntityManagementController } from './controllers/entity-management.controller'
import { EntityManagementService } from './services/entity-management.service'
import { SharedModule } from '../shared/shared.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Galgame.name, schema: GalgameSchema },
      { name: LightNovel.name, schema: LightNovelSchema },
      { name: LightNovelVolume.name, schema: LightNovelVolumeSchema },
      { name: UpdateRequest.name, schema: UpdateRequestSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Producer.name, schema: ProducerSchema },
      { name: Character.name, schema: CharacterSchema },
      { name: Tag.name, schema: TagSchema },
    ]),
    SharedModule,
  ],
  controllers: [
    GalgameManagementController,
    LightNovelManagementController,
    LightNovelVolumeManagementController,
    EntityManagementController,
  ],
  providers: [
    GalgameManagementService,
    LightNovelManagementService,
    LightNovelVolumeManagementService,
    EntityManagementService,
  ],
})
export class CreatorCenterModule {}
