import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Person, PersonDocument } from '../../modules/entities/schemas/person.schema'
import { Producer, ProducerDocument } from '../../modules/entities/schemas/producer.schema'
import { Character, CharacterDocument } from '../../modules/entities/schemas/character.schema'
import { Tag, TagDocument } from '../../modules/entities/schemas/tag.schema'

interface SyncEntityRelationsParams {
  originalData: any
  newData: any
  workType: 'Galgame' | 'LightNovel'
  options?: {
    skipRelationSync?: boolean
    throwOnError?: boolean
  }
}

interface WorkInfo {
  _id: Types.ObjectId
  type: string
  cover?: string
  name?: string
}

@Injectable()
export class EntityRelationsSyncService {
  private readonly logger = new Logger(EntityRelationsSyncService.name)

  constructor(
    @InjectModel(Person.name)
    private personModel: Model<PersonDocument>,
    @InjectModel(Producer.name)
    private producerModel: Model<ProducerDocument>,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    @InjectModel(Tag.name)
    private tagModel: Model<TagDocument>,
  ) {}

  async syncEntityRelations(params: SyncEntityRelationsParams): Promise<void> {
    const { originalData, newData, workType, options = {} } = params

    // 如果设置为跳过关联同步，则直接返回
    if (options.skipRelationSync) {
      return
    }

    const workId = originalData._id
    const workIdentifier = workType === 'Galgame' ? originalData.galId : originalData.novelId

    // 准备作品基本信息
    const workInfo: WorkInfo = {
      _id: workId,
      type: workType,
      cover: newData.cover || originalData.cover,
    }

    // 根据作品类型设置名称
    if (workType === 'Galgame') {
      workInfo.name =
        newData.transTitle ||
        originalData.transTitle ||
        (newData.originTitle && newData.originTitle[0]) ||
        (originalData.originTitle && originalData.originTitle[0])
    } else {
      workInfo.name = newData.name_cn || originalData.name_cn || newData.name || originalData.name
    }

    // 创建批量操作数组
    const bulkOperations: Promise<any>[] = []

    // 处理各种关联
    await this.handleCharacterRelations(originalData, newData, workType, workId, bulkOperations)
    await this.handleProducerRelations(originalData, newData, workType, workId, bulkOperations)
    await this.handleBunkoRelations(originalData, newData, workType, workId, bulkOperations)
    await this.handleStaffRelations(originalData, newData, workType, workId, bulkOperations)
    await this.handleAuthorRelations(originalData, newData, workType, workId, bulkOperations)
    await this.handleIllustratorRelations(originalData, newData, workType, workId, bulkOperations)
    await this.handleTagRelations(originalData, newData, workType, workId, bulkOperations)

    this.logger.log(
      `Syncing entity relations for ${workType} ${workIdentifier}. Operations: ${bulkOperations.length}`,
    )

    if (bulkOperations.length > 0) {
      try {
        await Promise.all(bulkOperations)
        this.logger.log(
          `Successfully synced all entity relations for ${workType} ${workIdentifier}`,
        )
      } catch (error) {
        this.logger.error(
          `Error syncing entity relations for ${workType} ${workIdentifier}:`,
          error,
        )
        if (options.throwOnError) {
          throw error
        }
      }
    } else {
      this.logger.log(`No entity relations to sync for ${workType} ${workIdentifier}`)
    }
  }

  private async handleCharacterRelations(
    originalData: any,
    newData: any,
    workType: string,
    workId: Types.ObjectId,
    bulkOperations: Promise<any>[],
  ): Promise<void> {
    if (!newData.characters) return

    const oldCharacterIds = (originalData.characters || [])
      .filter(c => c && c.character)
      .map(c => c.character.toString())

    const newCharacterIds = (newData.characters || [])
      .filter(c => c && (c._id || c.character))
      .map(c => (c._id || c.character).toString())

    const characterIdsToAdd = newCharacterIds.filter(id => !oldCharacterIds.includes(id))
    const characterIdsToRemove = oldCharacterIds.filter(id => !newCharacterIds.includes(id))
    const existingCharacterIds = newCharacterIds.filter(id => oldCharacterIds.includes(id))

    if (existingCharacterIds.length > 0) {
      await this.handleActorChangesForExistingCharacters(
        originalData,
        newData,
        existingCharacterIds,
        workType,
        workId,
        bulkOperations,
      )
    }

    // 添加关联操作
    if (characterIdsToAdd.length > 0) {
      const actToAdd = {
        work: {
          workId: workId,
          workType: workType === 'Galgame' ? 'Galgame' : 'LightNovel',
        },
      }

      // 为了避免重复添加，先检查每个角色是否已经有该作品的关联
      for (const characterId of characterIdsToAdd) {
        bulkOperations.push(
          this.characterModel.updateOne(
            {
              _id: characterId,
              'act.work.workId': { $ne: workId }, // 确保不存在该作品的关联
            },
            {
              $addToSet: {
                act: actToAdd,
              },
            },
          ),
        )
      }

      // 处理声优关联
      await this.handleActorRelations(characterIdsToAdd, workType, workId, bulkOperations, 'add')
    }

    // 移除关联操作
    if (characterIdsToRemove.length > 0) {
      const pullCondition = {
        'work.workId': workId,
      }

      bulkOperations.push(
        this.characterModel.updateMany(
          { _id: { $in: characterIdsToRemove } },
          {
            $pull: {
              act: pullCondition,
            },
          },
        ),
      )

      // 处理声优关联移除
      await this.handleActorRelations(
        characterIdsToRemove,
        workType,
        workId,
        bulkOperations,
        'remove',
        newCharacterIds,
      )
    }
  }

  private async handleActorRelations(
    characterIds: string[],
    workType: string,
    workId: Types.ObjectId,
    bulkOperations: Promise<any>[],
    action: 'add' | 'remove',
    remainingCharacterIds?: string[],
  ): Promise<void> {
    if (action === 'add') {
      const charactersWithActors = await this.characterModel
        .find({ _id: { $in: characterIds } })
        .select('act')
        .lean()

      const actorIds: string[] = []
      charactersWithActors.forEach(character => {
        if (character.act && Array.isArray(character.act)) {
          const matchingActItems = character.act.filter(
            actItem => actItem.work && actItem.work.workId.equals(workId),
          )

          matchingActItems.forEach(actItem => {
            // 只处理当前作品的声优关联
            if (actItem.person) {
              actorIds.push(actItem.person.toString())
            }
          })
        }
      })

      if (actorIds.length > 0) {
        const uniqueActorIds = [...new Set(actorIds)]

        const workToAdd = {
          workType: workType === 'Galgame' ? 'Galgame' : 'LightNovel',
          work: workId,
        }

        bulkOperations.push(
          this.personModel.updateMany(
            { _id: { $in: uniqueActorIds } },
            {
              $addToSet: {
                works: workToAdd,
              },
            },
          ),
        )
      }
    } else if (action === 'remove' && remainingCharacterIds) {
      // 移除声优关联：先获取被移除角色的声优
      const removedCharactersWithActors = await this.characterModel
        .find({ _id: { $in: characterIds } })
        .select('act')
        .lean()

      const removedActorIds: string[] = []
      removedCharactersWithActors.forEach(character => {
        if (character.act && Array.isArray(character.act)) {
          character.act.forEach(actItem => {
            if (actItem.person) {
              removedActorIds.push(actItem.person.toString())
            }
          })
        }
      })

      if (removedActorIds.length > 0) {
        // 查找仍与作品关联的角色中是否还有这些声优
        const remainingCharactersWithActors = await this.characterModel
          .find({ _id: { $in: remainingCharacterIds } })
          .select('act')
          .lean()

        const stillLinkedActorIds = new Set<string>()
        remainingCharactersWithActors.forEach(character => {
          if (character.act && Array.isArray(character.act)) {
            character.act.forEach(actItem => {
              if (actItem.person && actItem.work && actItem.work.workId.equals(workId)) {
                stillLinkedActorIds.add(actItem.person.toString())
              }
            })
          }
        })

        // 只移除那些不再与任何剩余角色关联的声优
        const actorIdsToRemove = removedActorIds.filter(id => !stillLinkedActorIds.has(id))

        if (actorIdsToRemove.length > 0) {
          const workToRemove = {
            work: workId,
          }

          bulkOperations.push(
            this.personModel.updateMany(
              { _id: { $in: actorIdsToRemove } },
              {
                $pull: {
                  works: workToRemove,
                },
              },
            ),
          )
        }
      }
    }
  }

  private async handleActorChangesForExistingCharacters(
    originalData: any,
    newData: any,
    characterIds: string[],
    workType: string,
    workId: Types.ObjectId,
    bulkOperations: Promise<any>[],
  ): Promise<void> {
    // 比对原始数据和新数据中角色的声优信息
    const originalActors = new Set<string>()
    const newActors = new Set<string>()

    // 从原始数据中提取当前作品的声优信息
    if (originalData.characters && Array.isArray(originalData.characters)) {
      originalData.characters.forEach(char => {
        if (char && char.character && characterIds.includes(char.character.toString())) {
          if (char.act && Array.isArray(char.act)) {
            char.act.forEach(actItem => {
              if (actItem.person && actItem.work && actItem.work.workId.equals(workId)) {
                originalActors.add(actItem.person.toString())
              }
            })
          }
        }
      })
    }

    // 从新数据中提取当前作品的声优信息
    if (newData.characters && Array.isArray(newData.characters)) {
      newData.characters.forEach(char => {
        if (
          char &&
          (char._id || char.character) &&
          characterIds.includes((char._id || char.character).toString())
        ) {
          if (char.act && Array.isArray(char.act)) {
            char.act.forEach(actItem => {
              if (actItem.person && actItem.work && actItem.work.workId.equals(workId)) {
                newActors.add(actItem.person.toString())
              }
            })
          }
        }
      })
    }

    const delayedActorSync = new Promise<void>(resolve => {
      setTimeout(async () => {
        try {
          // 从数据库查询更新后角色的当前 act 信息
          const currentCharacters = await this.characterModel
            .find({ _id: { $in: characterIds } })
            .select('act')
            .lean()

          const newActorIdsFromDB = new Set<string>()
          currentCharacters.forEach(character => {
            if (character.act && Array.isArray(character.act)) {
              const matchingActItems = character.act.filter(
                actItem => actItem.work && actItem.work.workId.equals(workId),
              )

              matchingActItems.forEach(actItem => {
                if (actItem.person) {
                  newActorIdsFromDB.add(actItem.person.toString())
                }
              })
            }
          })

          // 查询该作品下所有角色的历史声优信息，以确定之前的声优关联
          const allCharactersInWorkHistory = await this.characterModel
            .find({
              'act.work.workId': workId,
            })
            .select('act')
            .lean()

          const oldActorIdsFromCharacterAct = new Set<string>()
          allCharactersInWorkHistory.forEach(character => {
            if (character.act && Array.isArray(character.act)) {
              const matchingItems = character.act.filter(
                actItem => actItem.work && actItem.work.workId.equals(workId),
              )
              matchingItems.forEach(actItem => {
                if (actItem.person) {
                  oldActorIdsFromCharacterAct.add(actItem.person.toString())
                }
              })
            }
          })

          // 查询 Person 表中确实与该作品关联且是声优的人员
          const existingActorsInWork = await this.personModel
            .find({
              'works.work': workId,
              _id: { $in: [...oldActorIdsFromCharacterAct] },
            })
            .select('_id')
            .lean()
          // 将之前Person.works中的声优作为旧声优
          const oldActorIdsFromPersonWorks = new Set(
            existingActorsInWork.map(actor => actor._id.toString()),
          )
          // 比对找出差异
          const actorIdsToAdd = [...newActorIdsFromDB].filter(
            id => !oldActorIdsFromPersonWorks.has(id),
          )
          const actorIdsToRemove = [...oldActorIdsFromPersonWorks].filter(
            id => !newActorIdsFromDB.has(id),
          )

          // 处理新增的声优
          if (actorIdsToAdd.length > 0) {
            await this.personModel.updateMany(
              { _id: { $in: actorIdsToAdd } },
              {
                $addToSet: {
                  works: {
                    workType: workType === 'Galgame' ? 'Galgame' : 'LightNovel',
                    work: workId,
                  },
                },
              },
            )
          }

          // 处理移除的声优（需要检查该声优是否还为该作品的其他角色配音）
          if (actorIdsToRemove.length > 0) {
            // 查找该作品下所有角色的声优，确保不会误删还在为其他角色配音的声优
            const allCharactersInWork = await this.characterModel
              .find({
                'act.work.workId': workId,
                'act.person': { $in: actorIdsToRemove },
              })
              .select('act')
              .lean()

            const stillActiveActorIds = new Set<string>()
            allCharactersInWork.forEach(character => {
              if (character.act && Array.isArray(character.act)) {
                character.act
                  .filter(actItem => actItem.work && actItem.work.workId.equals(workId))
                  .forEach(actItem => {
                    if (actItem.person) {
                      stillActiveActorIds.add(actItem.person.toString())
                    }
                  })
              }
            })

            const finalActorIdsToRemove = actorIdsToRemove.filter(
              id => !stillActiveActorIds.has(id),
            )

            if (finalActorIdsToRemove.length > 0) {
              await this.personModel.updateMany(
                { _id: { $in: finalActorIdsToRemove } },
                {
                  $pull: {
                    works: {
                      work: workId,
                    },
                  },
                },
              )
            }
          }

          resolve()
        } catch (error) {
          this.logger.error('处理现有角色声优变化时发生错误', {
            workId: workId.toString(),
            error: error.message,
            stack: error.stack,
          })
          resolve()
        }
      }, 2000) // 延迟2秒等待角色数据更新完成
    })

    // 将延迟操作添加到批量操作中
    bulkOperations.push(delayedActorSync)
  }

  private async handleProducerRelations(
    originalData: any,
    newData: any,
    workType: string,
    workId: Types.ObjectId,
    bulkOperations: Promise<any>[],
  ): Promise<void> {
    if (!newData.producers && !newData.publishers) return

    const producerField = workType === 'Galgame' ? 'producers' : 'publishers'
    const producerProperty = workType === 'Galgame' ? 'producer' : 'publisher'

    const oldProducerIds = (originalData[producerField] || [])
      .filter(p => p && p[producerProperty])
      .map(p => p[producerProperty].toString())

    const newProducerIds = (newData[producerField] || [])
      .filter(p => p && (p._id || p[producerProperty]))
      .map(p => (p._id || p[producerProperty]).toString())

    const producerIdsToAdd = newProducerIds.filter(id => !oldProducerIds.includes(id))
    const producerIdsToRemove = oldProducerIds.filter(id => !newProducerIds.includes(id))

    if (producerIdsToAdd.length > 0) {
      bulkOperations.push(
        this.producerModel.updateMany(
          { _id: { $in: producerIdsToAdd } },
          {
            $addToSet: {
              works: {
                workType: workType === 'Galgame' ? 'Galgame' : 'LightNovel',
                work: workId,
              },
            },
          },
        ),
      )
    }

    if (producerIdsToRemove.length > 0) {
      bulkOperations.push(
        this.producerModel.updateMany(
          { _id: { $in: producerIdsToRemove } },
          {
            $pull: {
              works: {
                work: workId,
              },
            },
          },
        ),
      )
    }
  }

  private async handleBunkoRelations(
    originalData: any,
    newData: any,
    workType: string,
    workId: Types.ObjectId,
    bulkOperations: Promise<any>[],
  ): Promise<void> {
    if (workType !== 'LightNovel' || !newData.bunko) return

    const oldBunkoId = originalData.bunko ? originalData.bunko.toString() : null
    const newBunkoId = newData.bunko._id
      ? newData.bunko._id.toString()
      : newData.bunko
        ? newData.bunko.toString()
        : null

    if (newBunkoId && oldBunkoId !== newBunkoId) {
      // 移除旧文库关联
      if (oldBunkoId) {
        bulkOperations.push(
          this.producerModel.updateOne({ _id: oldBunkoId }, { $pull: { works: { work: workId } } }),
        )
      }

      // 添加新文库关联
      bulkOperations.push(
        this.producerModel.updateOne(
          { _id: newBunkoId },
          {
            $addToSet: {
              works: {
                workType: 'LightNovel',
                work: workId,
              },
            },
          },
        ),
      )
    }
  }

  private async handleStaffRelations(
    originalData: any,
    newData: any,
    workType: string,
    workId: Types.ObjectId,
    bulkOperations: Promise<any>[],
  ): Promise<void> {
    if (workType !== 'Galgame' || !newData.staffs) return

    const oldStaffIds = (originalData.staffs || [])
      .filter(s => s && s.person)
      .map(s => s.person.toString())

    const newStaffIds = (newData.staffs || [])
      .filter(s => s && (s._id || s.person))
      .map(s => (s._id || s.person).toString())

    const staffIdsToAdd = newStaffIds.filter(id => !oldStaffIds.includes(id))
    const staffIdsToRemove = oldStaffIds.filter(id => !newStaffIds.includes(id))

    if (staffIdsToAdd.length > 0) {
      bulkOperations.push(
        this.personModel.updateMany(
          { _id: { $in: staffIdsToAdd } },
          {
            $addToSet: {
              works: {
                workType: 'Galgame',
                work: workId,
              },
            },
          },
        ),
      )
    }

    if (staffIdsToRemove.length > 0) {
      bulkOperations.push(
        this.personModel.updateMany(
          { _id: { $in: staffIdsToRemove } },
          {
            $pull: {
              works: {
                work: workId,
              },
            },
          },
        ),
      )
    }
  }

  private async handleAuthorRelations(
    originalData: any,
    newData: any,
    workType: string,
    workId: Types.ObjectId,
    bulkOperations: Promise<any>[],
  ): Promise<void> {
    if (workType !== 'LightNovel' || !newData.author) return

    const oldAuthorId = originalData.author ? originalData.author.toString() : null
    const newAuthorId = newData.author._id
      ? newData.author._id.toString()
      : newData.author
        ? newData.author.toString()
        : null

    if (newAuthorId && oldAuthorId !== newAuthorId) {
      // 移除旧作者关联
      if (oldAuthorId) {
        bulkOperations.push(
          this.personModel.updateOne({ _id: oldAuthorId }, { $pull: { works: { work: workId } } }),
        )
      }

      // 添加新作者关联
      bulkOperations.push(
        this.personModel.updateOne(
          { _id: newAuthorId },
          {
            $addToSet: {
              works: {
                workType: 'LightNovel',
                work: workId,
              },
            },
          },
        ),
      )
    }
  }

  private async handleIllustratorRelations(
    originalData: any,
    newData: any,
    workType: string,
    workId: Types.ObjectId,
    bulkOperations: Promise<any>[],
  ): Promise<void> {
    if (workType !== 'LightNovel' || !newData.illustrators) return

    const oldIllustratorIds = (originalData.illustrators || [])
      .filter(i => i && i.illustrator)
      .map(i => i.illustrator.toString())

    const newIllustratorIds = (newData.illustrators || [])
      .filter(i => i && (i._id || i.illustrator))
      .map(i => (i._id || i.illustrator).toString())

    const illustratorIdsToAdd = newIllustratorIds.filter(id => !oldIllustratorIds.includes(id))
    const illustratorIdsToRemove = oldIllustratorIds.filter(id => !newIllustratorIds.includes(id))

    if (illustratorIdsToAdd.length > 0) {
      bulkOperations.push(
        this.personModel.updateMany(
          { _id: { $in: illustratorIdsToAdd } },
          {
            $addToSet: {
              works: {
                workType: 'LightNovel',
                work: workId,
              },
            },
          },
        ),
      )
    }

    if (illustratorIdsToRemove.length > 0) {
      bulkOperations.push(
        this.personModel.updateMany(
          { _id: { $in: illustratorIdsToRemove } },
          {
            $pull: {
              works: {
                work: workId,
              },
            },
          },
        ),
      )
    }
  }

  private async handleTagRelations(
    originalData: any,
    newData: any,
    workType: string,
    workId: Types.ObjectId,
    bulkOperations: Promise<any>[],
  ): Promise<void> {
    if (!newData.tags) return

    const oldTagIds = (originalData.tags || []).filter(t => t && t.tag).map(t => t.tag.toString())

    const newTagIds = (newData.tags || [])
      .filter(t => t && (t._id || t.tag))
      .map(t => (t._id || t.tag).toString())

    const tagIdsToAdd = newTagIds.filter(id => !oldTagIds.includes(id))
    const tagIdsToRemove = oldTagIds.filter(id => !newTagIds.includes(id))

    if (tagIdsToAdd.length > 0) {
      bulkOperations.push(
        this.tagModel.updateMany(
          { _id: { $in: tagIdsToAdd } },
          {
            $addToSet: {
              works: {
                workType: workType === 'Galgame' ? 'Galgame' : 'LightNovel',
                work: workId,
              },
            },
          },
        ),
      )
    }

    if (tagIdsToRemove.length > 0) {
      bulkOperations.push(
        this.tagModel.updateMany(
          { _id: { $in: tagIdsToRemove } },
          {
            $pull: {
              works: {
                work: workId,
              },
            },
          },
        ),
      )
    }
  }
}
