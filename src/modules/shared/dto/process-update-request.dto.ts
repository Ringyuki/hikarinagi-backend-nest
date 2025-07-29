import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
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

  @IsString()
  @Length(1, 100)
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
