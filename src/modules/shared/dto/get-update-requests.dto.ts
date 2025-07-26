import { IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { EntityType } from './create-update-request.dto'

enum Status {
  PENDING = 'pending',
  MERGED = 'merged',
  REJECTED = 'rejected',
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
