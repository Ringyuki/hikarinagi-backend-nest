import { IsOptional, IsNotEmpty, IsEnum, IsString } from 'class-validator'
import { UIComponentType } from '../enums/UIComponentType.enum'

export class GetUIComponentDto {
  @IsNotEmpty()
  @IsEnum(UIComponentType)
  type: UIComponentType

  @IsOptional()
  @IsString()
  page?: string

  @IsOptional()
  @IsString()
  position?: string
}
