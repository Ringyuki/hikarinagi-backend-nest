import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Person, PersonSchema } from './schemas/person.schema'
import { Producer, ProducerSchema } from './schemas/producer.schema'
import { Character, CharacterSchema } from './schemas/character.schema'
import { Tag, TagSchema } from './schemas/tag.schema'
import { Galgame, GalgameSchema } from '../galgame/schemas/galgame.schema'
import { LightNovel, LightNovelSchema } from '../novel/schemas/light-novel.schema'
import {
  SharedEntityHistory,
  SharedEntityHistorySchema,
} from './schemas/shared-entity-history.schema'
import { PersonService } from './services/person.service'
import { ProducerService } from './services/producer.service'
import { CharacterService } from './services/character.service'
import { TagService } from './services/tag.service'
import { CharacterController } from './controllers/character.controller'
import { PersonController } from './controllers/person.controller'

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Person.name, schema: PersonSchema },
      { name: Producer.name, schema: ProducerSchema },
      { name: Character.name, schema: CharacterSchema },
      { name: Tag.name, schema: TagSchema },
      { name: Galgame.name, schema: GalgameSchema },
      { name: LightNovel.name, schema: LightNovelSchema },
      { name: SharedEntityHistory.name, schema: SharedEntityHistorySchema },
    ]),
  ],
  providers: [PersonService, ProducerService, CharacterService, TagService],
  exports: [PersonService, ProducerService, CharacterService, TagService, MongooseModule],
  controllers: [CharacterController, PersonController],
})
export class EntitiesModule {}
