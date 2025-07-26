import { IsNotEmpty, IsMongoId, IsEnum, IsObject, ValidateNested } from 'class-validator'
import { Types } from 'mongoose'
import { EntityType } from './create-update-request.dto'
import { Type } from 'class-transformer'

export class MergeUpdateRequestDto {
  @IsNotEmpty()
  @IsEnum(EntityType)
  itemType: EntityType

  @IsNotEmpty()
  @IsMongoId()
  itemId: Types.ObjectId

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  mergeData: Record<string, any>

  @IsNotEmpty()
  @IsMongoId()
  processedBy: Types.ObjectId

  @IsNotEmpty()
  @IsMongoId()
  requestedBy: Types.ObjectId
}
