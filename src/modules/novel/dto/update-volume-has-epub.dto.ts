import { IsBoolean } from 'class-validator'

export class UpdateVolumeHasEpubDto {
  @IsBoolean()
  hasEpub: boolean
}
