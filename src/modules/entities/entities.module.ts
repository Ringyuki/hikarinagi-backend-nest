import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Person, PersonSchema } from './schemas/person.schema'
import { Producer, ProducerSchema } from './schemas/producer.schema'
import { Character, CharacterSchema } from './schemas/character.schema'
import { Tag, TagSchema } from './schemas/tag.schema'
import { PersonService } from './services/person.service'
import { ProducerService } from './services/producer.service'
import { CharacterService } from './services/character.service'
import { TagService } from './services/tag.service'
import { CharacterController } from './controllers/character.controller'

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Person.name, schema: PersonSchema },
      { name: Producer.name, schema: ProducerSchema },
      { name: Character.name, schema: CharacterSchema },
      { name: Tag.name, schema: TagSchema },
    ]),
  ],
  providers: [PersonService, ProducerService, CharacterService, TagService],
  exports: [PersonService, ProducerService, CharacterService, TagService, MongooseModule],
  controllers: [CharacterController],
})
export class EntitiesModule {}
