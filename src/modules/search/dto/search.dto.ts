import { IsNotEmpty, IsString, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator'
import { SearchType } from '../types/SearchType.types'
import { Transform, Type } from 'class-transformer'

export class SearchDto {
  @IsString()
  @IsNotEmpty()
  keyword: string

  @IsEnum(SearchType)
  @IsNotEmpty()
  type: SearchType

  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  @Min(1)
  @Max(100)
  page: number

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit: number

  @IsBoolean()
  @IsNotEmpty()
  @Transform(({ value }) =>
    value === undefined
      ? false
      : value === true || value === 'true' || value === 1 || value === '1',
  )
  relative_match: boolean
}
