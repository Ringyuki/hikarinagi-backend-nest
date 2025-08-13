import { Type } from 'class-transformer'
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsObject,
  IsMongoId,
  IsEnum,
  IsNumber,
} from 'class-validator'
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

class EntityDto {
  @IsNumber()
  @IsOptional()
  id?: number

  @IsMongoId()
  @IsOptional()
  _id?: Types.ObjectId

  @IsString()
  @IsNotEmpty()
  name?: string

  @IsString()
  @IsOptional()
  image?: string

  @IsString()
  @IsOptional()
  logo?: string

  @IsString()
  @IsOptional()
  note?: string

  @IsString()
  @IsOptional()
  role?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActDto)
  @IsOptional()
  act?: ActDto[]
}

class VolumeInSeriesDto {
  @IsMongoId()
  @IsNotEmpty()
  _id: Types.ObjectId

  @IsNumber()
  @IsNotEmpty()
  volumeId: number

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  name_cn?: string

  @IsString()
  @IsOptional()
  cover?: string

  @IsString()
  @IsOptional()
  status?: string
}

class SeriesDto {
  @IsNumber()
  @IsOptional()
  totalVolumes: number | null

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VolumeInSeriesDto)
  @IsOptional()
  volumes?: VolumeInSeriesDto[]
}

enum NovelStatus {
  SERIALIZING = 'SERIALIZING',
  FINISHED = 'FINISHED',
  PAUSED = 'PAUSED',
  ABANDONED = 'ABANDONED',
}

enum Status {
  PENDING = 'pending',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  DELETED = 'deleted',
  DRAFT = 'draft',
}

export class UpdateLightNovelDto {
  @IsString()
  @IsOptional()
  _id?: string

  @IsNumber()
  @IsOptional()
  bangumiBookId?: number

  @IsNumber()
  @IsOptional()
  novelId?: number

  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  name_cn?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  otherNames?: string[]

  @IsString()
  @IsOptional()
  cover?: string

  @IsObject()
  @ValidateNested()
  @Type(() => EntityDto)
  @IsOptional()
  author?: EntityDto

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityDto)
  @IsOptional()
  illustrators?: EntityDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityDto)
  @IsOptional()
  publishers?: EntityDto[]

  @IsObject()
  @ValidateNested()
  @Type(() => EntityDto)
  @IsOptional()
  bunko?: EntityDto

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityDto)
  @IsOptional()
  characters?: EntityDto[]

  @IsEnum(NovelStatus)
  @IsOptional()
  novelStatus?: NovelStatus

  @IsObject()
  @ValidateNested()
  @Type(() => SeriesDto)
  @IsOptional()
  series?: SeriesDto

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityDto)
  @IsOptional()
  tags?: EntityDto[]

  @IsString()
  @IsOptional()
  summary?: string

  @IsString()
  @IsOptional()
  summary_cn?: string

  @IsBoolean()
  @IsOptional()
  nsfw?: boolean

  @IsBoolean()
  @IsOptional()
  locked?: boolean

  @IsEnum(Status)
  @IsOptional()
  status?: Status

  @IsObject()
  @ValidateNested()
  @Type(() => CreatorDto)
  @IsOptional()
  creator?: CreatorDto

  @IsString()
  @IsOptional()
  createdAt?: string

  @IsString()
  @IsOptional()
  updatedAt?: string
}
