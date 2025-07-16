import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  ValidateBy,
  Min,
} from 'class-validator'

export class UpdateGalgameDto {}

export class UpdateGalgameCoverAndImagesDto {
  @IsString({ message: 'cover must be a string' })
  @IsNotEmpty({ message: 'cover is required' })
  cover: string

  @IsArray({ message: 'images must be an array' })
  @IsString({ each: true, message: 'each image must be a string' })
  images: string[]

  @IsNumber({}, { message: 'headCover must be a number' })
  @Min(0, { message: 'headCover must be greater than or equal to 0' })
  @ValidateBy({
    name: 'isValidHeadCover',
    validator: {
      validate: (value: any, args: any) => {
        if (value === undefined || value === null) return true
        const object = args.object as UpdateGalgameCoverAndImagesDto
        if (!object.images || !Array.isArray(object.images)) return false
        return value < object.images.length
      },
      defaultMessage: () => 'headCover must be less than images array length',
    },
  })
  @IsOptional()
  headCover?: number
}
