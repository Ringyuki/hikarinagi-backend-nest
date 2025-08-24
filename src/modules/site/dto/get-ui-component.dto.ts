import { IsOptional, IsNotEmpty, IsEnum, IsString } from 'class-validator'
import { UIComponentType } from '../types/UIComponentType.types'

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
