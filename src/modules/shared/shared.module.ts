import { Module, Global } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Counter, CounterSchema } from './schemas/counter.schema'
import { CounterService } from './services/counter.service'
import { EntityRelationsSyncService } from '../../common/services/entity-relations-sync.service'
import { UpdateRequest, UpdateRequestSchema } from './schemas/update-request.schema'
import { UpdateRequestService } from './services/update-request.service'
import { UpdateRequestController } from './controllers/update-request.controller'
import { Person, PersonSchema } from '../entities/schemas/person.schema'
import { Producer, ProducerSchema } from '../entities/schemas/producer.schema'
import { Character, CharacterSchema } from '../entities/schemas/character.schema'
import { Tag, TagSchema } from '../entities/schemas/tag.schema'
import { UpdateRequestMergeService } from './services/update-request-merge.service'
import { User, UserSchema } from '../../modules/user/schemas/user.schema'
import { LightNovel, LightNovelSchema } from '../../modules/novel/schemas/light-novel.schema'
import {
  LightNovelVolume,
  LightNovelVolumeSchema,
} from '../../modules/novel/schemas/light-novel-volume.schema'
import { Galgame, GalgameSchema } from '../../modules/galgame/schemas/galgame.schema'
import { EditHistoryService } from '../../common/services/edit-history.service'
import {
  GalgameHistory,
  GalgameHistorySchema,
} from '../../modules/galgame/schemas/galgame-history.schema'
import {
  LightNovelHistory,
  LightNovelHistorySchema,
} from '../../modules/novel/schemas/light-novel-history.schema'
import {
  LightNovelVolumeHistory,
  LightNovelVolumeHistorySchema,
} from '../../modules/novel/schemas/light-novel-volume-history.schema'
import {
  SharedEntityHistory,
  SharedEntityHistorySchema,
} from '../../modules/entities/schemas/shared-entity-history.schema'

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Counter.name, schema: CounterSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Producer.name, schema: ProducerSchema },
      { name: Character.name, schema: CharacterSchema },
      { name: Tag.name, schema: TagSchema },
      { name: UpdateRequest.name, schema: UpdateRequestSchema },
      { name: User.name, schema: UserSchema },
      { name: LightNovel.name, schema: LightNovelSchema },
      { name: LightNovelVolume.name, schema: LightNovelVolumeSchema },
      { name: Galgame.name, schema: GalgameSchema },
      { name: GalgameHistory.name, schema: GalgameHistorySchema },
      { name: LightNovelHistory.name, schema: LightNovelHistorySchema },
      { name: LightNovelVolumeHistory.name, schema: LightNovelVolumeHistorySchema },
      { name: SharedEntityHistory.name, schema: SharedEntityHistorySchema },
    ]),
  ],
  providers: [
    CounterService,
    EntityRelationsSyncService,
    UpdateRequestService,
    UpdateRequestMergeService,
    EditHistoryService,
  ],
  exports: [CounterService, EntityRelationsSyncService, UpdateRequestService],
  controllers: [UpdateRequestController],
})
export class SharedModule {}
