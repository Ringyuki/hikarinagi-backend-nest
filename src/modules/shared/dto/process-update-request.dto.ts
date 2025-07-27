import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Max,
  IsOptional,
  ValidateBy,
  ValidationArguments,
} from 'class-validator'

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
