import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsMongoId,
  IsEnum,
  IsObject,
  IsOptional,
} from 'class-validator'
import { Types } from 'mongoose'

export enum EntityType {
  Galgame = 'Galgame',
  LightNovel = 'LightNovel',
  LightNovelVolume = 'LightNovelVolume',
  Producer = 'Producer',
  Person = 'Person',
  Character = 'Character',
  Tag = 'Tag',
}

class UpdateRequestChanges {
  @IsNotEmpty()
  @IsObject()
  @IsOptional()
  previous?: object | null

  @IsNotEmpty()
  @IsObject()
  updated: object

  @IsOptional()
  @IsArray()
  changedFields?: string[]
}

export class CreateUpdateRequestDto {
  @IsNotEmpty()
  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  @IsNotEmpty()
  entityId: Types.ObjectId

  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  description: string

  @IsMongoId()
  @IsString()
  @IsNotEmpty()
  requestedBy: Types.ObjectId

  @IsObject()
  @IsNotEmpty()
  changes: UpdateRequestChanges
}
