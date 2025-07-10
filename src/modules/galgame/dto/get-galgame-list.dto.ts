import { IsOptional, IsString, IsNotEmpty } from 'class-validator'

export class GetGalgameListDto {
  @IsString()
  @IsNotEmpty({ message: 'page is required' })
  page: number

  @IsString()
  @IsNotEmpty({ message: 'limit is required' })
  limit: number

  @IsString()
  @IsOptional()
  year?: string

  @IsString()
  @IsOptional()
  month?: string

  @IsString()
  @IsOptional()
  sortField?: string

  @IsString()
  @IsOptional()
  sortOrder?: string

  @IsString()
  @IsOptional()
  tagsField?: string[]
}
