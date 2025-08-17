import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { Character, CharacterDocument } from '../modules/entities/schemas/character.schema'
import { getModelToken } from '@nestjs/mongoose'
import { Model } from 'mongoose'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const characterModel = app.get<Model<CharacterDocument>>(getModelToken(Character.name))

  console.log('Starting character migration...')

  const characters = await characterModel
    .find({
      $or: [{ works: { $exists: true } }, { actors: { $exists: true } }],
    })
    .lean()

  if (characters.length === 0) {
    console.log('No characters to migrate.')
    await app.close()
    return
  }

  console.log(`Found ${characters.length} characters to migrate.`)

  let migratedCount = 0
  for (const character of characters) {
    const legacyCharacter = character as any
    try {
      const firstActorId =
        legacyCharacter.actors && legacyCharacter.actors.length > 0
          ? legacyCharacter.actors[0]
          : null

      const newAct = (legacyCharacter.works || []).map((work: any) => ({
        work: {
          workId: work.work,
          workType: work.workType,
        },
        ...(firstActorId && { person: firstActorId }),
      }))

      await characterModel.updateOne(
        { _id: legacyCharacter._id },
        {
          $set: { act: newAct },
          $unset: { works: 1, actors: 1 },
        },
        { strict: false },
      )
      migratedCount++
    } catch (error) {
      console.error(`Failed to migrate character with ID: ${legacyCharacter._id}`, error)
    }
  }

  console.log(
    `Migration complete. Migrated ${migratedCount} out of ${characters.length} characters.`,
  )

  await app.close()
}

bootstrap()
