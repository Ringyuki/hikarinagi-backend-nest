import { IsMongoId, IsNotEmpty, IsString } from 'class-validator'
import { Types } from 'mongoose'

export enum EntityType {
  GALGAME = 'Galgame',
  LIGHT_NOVEL = 'LightNovel',
  LIGHT_NOVEL_VOLUME = 'LightNovelVolume',
}

export class GetUpdateRequestsByEntityParamsDto {
  @IsString()
  @IsNotEmpty()
  entityType: EntityType

  @IsNotEmpty()
  @IsMongoId()
  entityId: Types.ObjectId
}
