import { IsNotEmpty, IsNumber } from 'class-validator'

export class DownloadAuthDto {
  @IsNotEmpty({ message: 'id is required' })
  @IsNumber()
  id: number

  @IsNotEmpty({ message: 'timestamp is required' })
  @IsNumber()
  timestamp: number
}
