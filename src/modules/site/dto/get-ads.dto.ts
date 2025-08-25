import { IsString, IsOptional } from 'class-validator'

export class GetAdsDto {
  @IsString()
  page: string

  @IsOptional()
  @IsString()
  position?: string
}
