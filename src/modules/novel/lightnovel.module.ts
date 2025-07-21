import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { LightNovel, LightNovelSchema } from './schemas/light-novel.schema'
import { LightNovelVolume, LightNovelVolumeSchema } from './schemas/light-novel-volume.schema'
import { LightNovelService } from './services/lightnovel.service'
import { LightNovelVolumeService } from './services/lightnovel-volume.service'
import { LightNovelController } from './controllers/lightnovel.controller'
import { LightNovelVolumeController } from './controllers/lightnovel-volume.controller'
import { EditHistoryService } from '../../common/services/edit-history.service'
import { LightNovelHistory, LightNovelHistorySchema } from './schemas/light-novel-history.schema'
import {
  LightNovelVolumeHistory,
  LightNovelVolumeHistorySchema,
} from './schemas/light-novel-volume-history.schema'
import { GalgameHistory, GalgameHistorySchema } from '../galgame/schemas/galgame-history.schema'
import {
  SharedEntityHistory,
  SharedEntityHistorySchema,
} from '../entities/schemas/shared-entity-history.schema'
import { Tag, TagSchema } from '../entities/schemas/tag.schema'
import { Producer, ProducerSchema } from '../entities/schemas/producer.schema'
import { Person, PersonSchema } from '../entities/schemas/person.schema'
import { Character, CharacterSchema } from '../entities/schemas/character.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LightNovel.name, schema: LightNovelSchema }]),
    MongooseModule.forFeature([{ name: LightNovelVolume.name, schema: LightNovelVolumeSchema }]),
    MongooseModule.forFeature([{ name: LightNovelHistory.name, schema: LightNovelHistorySchema }]),
    MongooseModule.forFeature([
      { name: LightNovelVolumeHistory.name, schema: LightNovelVolumeHistorySchema },
    ]),
    MongooseModule.forFeature([{ name: GalgameHistory.name, schema: GalgameHistorySchema }]),
    MongooseModule.forFeature([
      { name: SharedEntityHistory.name, schema: SharedEntityHistorySchema },
    ]),
    MongooseModule.forFeature([{ name: Tag.name, schema: TagSchema }]),
    MongooseModule.forFeature([{ name: Producer.name, schema: ProducerSchema }]),
    MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }]),
    MongooseModule.forFeature([{ name: Character.name, schema: CharacterSchema }]),
  ],
  providers: [LightNovelService, LightNovelVolumeService, EditHistoryService],
  controllers: [LightNovelController, LightNovelVolumeController],
})
export class LightNovelModule {}
