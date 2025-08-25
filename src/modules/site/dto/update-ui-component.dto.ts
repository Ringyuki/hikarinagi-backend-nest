import { IsNotEmpty, IsString, IsEnum, IsOptional, IsArray, IsObject } from 'class-validator'
import { UIComponentType } from '../enums/UIComponentType.enum'
import { AdItem, AdSettings } from '../types/components/AdComponent.types'

export class UpdateUIComponentDto {
  @IsOptional()
  @IsEnum(UIComponentType)
  type?: UIComponentType

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
  @IsString()
  createdBy?: string

  @IsOptional()
  @IsArray()
  items?: any[]

  @IsOptional()
  @IsObject()
  settings?: any
}

export class UpdateAdComponentDto extends UpdateUIComponentDto {
  @IsNotEmpty()
  @IsArray()
  items: AdItem[]

  @IsOptional()
  @IsObject()
  settings?: AdSettings
}
