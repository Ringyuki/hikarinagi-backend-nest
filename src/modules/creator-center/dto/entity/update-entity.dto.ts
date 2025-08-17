import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsNotEmpty,
  IsMongoId,
  ValidateNested,
  IsEnum,
  IsObject,
} from 'class-validator'
import { Type } from 'class-transformer'
import { Types } from 'mongoose'

class WorkActDto {
  @IsMongoId()
  @IsNotEmpty()
  workId: Types.ObjectId

  @IsString()
  @IsNotEmpty()
  workType: string
}

class ActDto {
  @ValidateNested()
  @Type(() => WorkActDto)
  @IsOptional()
  work?: WorkActDto

  @IsMongoId()
  @IsOptional()
  person?: Types.ObjectId
}

class CreatorDto {
  @IsMongoId()
  @IsOptional()
  _id?: Types.ObjectId

  @IsString()
  @IsOptional()
  avatar?: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  userId: string
}

class EntityLabel {
  @IsString()
  @IsNotEmpty()
  key: string

  @IsString()
  @IsNotEmpty()
  value: string
}

enum EntityStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
  DELETED = 'deleted',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

export class UpdateEntityDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  id: number

  @IsMongoId()
  @IsOptional()
  @Type(() => Types.ObjectId)
  _id: Types.ObjectId

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  transName: string

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  aliases: string[]

  @IsString()
  @IsOptional()
  intro: string

  @IsString()
  @IsOptional()
  transIntro: string

  @IsString()
  @IsOptional()
  image: string

  @IsString()
  @IsOptional()
  logo: string

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EntityLabel)
  labels: EntityLabel[]

  @IsString()
  @IsOptional()
  country: string

  @IsString()
  @IsOptional()
  established: string

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  type: string[]

  @IsEnum(EntityStatus)
  @IsOptional()
  status: EntityStatus

  @IsArray()
  @IsOptional()
  @Type(() => ActDto)
  act: ActDto[]

  @IsObject()
  @IsOptional()
  creator: CreatorDto
}
