import { IsMongoId, IsNotEmpty, IsString } from 'class-validator'
import { Types } from 'mongoose'

export enum EntityType {
  GALGAME = 'Galgame',
  LIGHT_NOVEL = 'LightNovel',
  LIGHT_NOVEL_VOLUME = 'LightNovelVolume',
  CHARACTER = 'Character',
  PERSON = 'Person',
  PRODUCER = 'Producer',
}

export class GetUpdateRequestsByEntityParamsDto {
  @IsString()
  @IsNotEmpty()
  entityType: EntityType

  @IsNotEmpty()
  @IsMongoId()
  entityId: Types.ObjectId
}
