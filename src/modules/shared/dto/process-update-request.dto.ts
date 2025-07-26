import {
  IsEnum,
  IsNotEmpty,
  IsMongoId,
  IsString,
  Max,
  IsOptional,
  ValidateBy,
  ValidationArguments,
} from 'class-validator'
import { Types } from 'mongoose'

enum Action {
  MERGE = 'merge',
  REJECT = 'reject',
}

export class ProcessUpdateRequestDto {
  @IsNotEmpty()
  @IsEnum(Action)
  action: Action

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  processedBy: Types.ObjectId

  @IsNotEmpty()
  @IsString()
  @Max(100)
  @IsOptional()
  @ValidateBy({
    name: 'rejectionReason',
    validator: {
      validate: (value, args: ValidationArguments) => {
        if (args.object['action'] === Action.REJECT) {
          return value !== undefined && value !== null && value.trim() !== ''
        }
        return true
      },
      defaultMessage: () => 'Rejection reason is required',
    },
  })
  rejectionReason?: string
}
