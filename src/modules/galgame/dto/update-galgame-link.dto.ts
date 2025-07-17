import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator'

enum GalgameLinkType {
  OFFICIAL_LINK = 'official-link',
  DOWNLOAD_LINK = 'download-link',
}

enum DownloadType {
  GAME = 'game',
  PATCH = 'patch',
  VOICE = 'voice',
  MUSIC = 'music',
  OTHER = 'other',
}

export class UpdateGalgameLinkDto {
  @IsString()
  @IsOptional()
  userId: string

  @IsEnum(GalgameLinkType)
  @IsNotEmpty()
  linkType: string

  @IsString()
  @IsNotEmpty()
  link: string

  @IsString()
  @IsOptional()
  note: string

  @IsString()
  @IsEnum(DownloadType)
  @IsOptional()
  type: string

  @IsString()
  @IsOptional()
  download_type: string

  @IsString()
  @IsOptional()
  size: string

  @IsString()
  @IsOptional()
  language: string

  @IsString()
  @IsOptional()
  platform: string

  @IsString()
  @IsOptional()
  password: string

  @IsString()
  @IsOptional()
  unzip_password: string
}
