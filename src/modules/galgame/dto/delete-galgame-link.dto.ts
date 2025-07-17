import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator'

enum GalgameLinkType {
  OFFICIAL_LINK = 'official-link',
  DOWNLOAD_LINK = 'download-link',
}

export class DeleteGalgameLinkDto {
  @IsString()
  @IsEnum(GalgameLinkType)
  @IsNotEmpty()
  linkType: string

  @IsString()
  @IsOptional()
  userId?: string
}
