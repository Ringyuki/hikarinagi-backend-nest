import { IsNumber, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class GetGalgameMonthlyReleasesDto {
  @IsNumber()
  @Type(() => Number)
  year: number

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(12)
  month: number
}
