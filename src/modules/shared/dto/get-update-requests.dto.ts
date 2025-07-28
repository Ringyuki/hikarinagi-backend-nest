import { IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator'
import { Type } from 'class-transformer'

enum Status {
  PENDING = 'pending',
  MERGED = 'merged',
  REJECTED = 'rejected',
  ALL = '',
}
enum EntityType {
  Galgame = 'Galgame',
  LightNovel = 'LightNovel',
  LightNovelVolume = 'LightNovelVolume',
  Producer = 'Producer',
  Person = 'Person',
  Character = 'Character',
  All = '',
}

export class GetUpdateRequestsDto {
  @IsEnum(EntityType)
  @IsOptional()
  entityType?: EntityType

  @IsEnum(Status)
  @IsOptional()
  status?: Status

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsNotEmpty()
  page: number = 1

  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @IsNotEmpty()
  limit: number = 10
}
