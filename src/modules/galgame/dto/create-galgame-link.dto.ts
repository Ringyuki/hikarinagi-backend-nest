import {
  IsOptional,
  IsString,
  IsNumber,
  IsNotEmpty,
  ValidateBy,
  Min,
  IsUrl,
  IsEnum,
} from 'class-validator'

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

enum SizeFormat {
  KB = 'KB',
  MB = 'MB',
  GB = 'GB',
}

enum Language {
  CN = 'cn',
  JP = 'jp',
  EN = 'en',
}

export class CreateGalgameLinkDto {
  @IsString()
  @IsNotEmpty()
  galgame_Id: string

  @IsEnum(GalgameLinkType)
  @IsNotEmpty()
  linkType: string

  @IsString()
  @IsUrl({}, { message: 'link must be a valid URL' })
  @IsNotEmpty()
  link: string

  @IsString()
  @IsOptional()
  note: string

  @IsString()
  @IsOptional()
  officialLinkPlatform?: string

  @IsString()
  @IsOptional()
  @IsEnum(DownloadType)
  downloadType?: string

  @IsNumber()
  @Min(0, { message: 'size must be greater than or equal to 0' })
  @IsOptional()
  size?: number

  @IsString()
  @IsEnum(SizeFormat)
  @IsOptional()
  @ValidateBy({
    name: 'isValidSizeFormat',
    validator: {
      validate: (value: any, args: any) => {
        const object = args.object as CreateGalgameLinkDto
        if (object.size && (value === undefined || value === null)) return false
        return true
      },
      defaultMessage: () => 'sizeFormat is required when size is provided',
    },
  })
  sizeFormat?: string

  @IsString()
  @IsOptional()
  downloadLinkType?: string

  @IsString()
  @IsEnum(Language)
  @IsOptional()
  language?: string

  @IsString()
  @IsOptional()
  platform?: string

  @IsString()
  @IsOptional()
  linkPassword?: string

  @IsString()
  @IsOptional()
  unzipPassword?: string
}
