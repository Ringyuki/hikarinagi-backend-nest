import { IsNotEmpty, IsString, IsEnum, IsOptional, IsMongoId } from 'class-validator'
import { Types } from 'mongoose'
import { Transform } from 'class-transformer'
import { UIComponentType } from '../enums/UIComponentType.enum'

export class CreateUIComponentDto {
  @IsOptional()
  @IsEnum(UIComponentType)
  type: UIComponentType

  @IsNotEmpty()
  @IsString()
  page: string

  @IsOptional()
  @IsString()
  position?: string

  @IsOptional()
  @IsString()
  note?: string

  @IsOptional()
  @IsString()
  section?: string

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }) => new Types.ObjectId(String(value)))
  createdBy: Types.ObjectId
}
