import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator'
import { Types } from 'mongoose'

export class UserCheckInDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: Types.ObjectId

  @IsBoolean()
  @IsOptional()
  isMakeUp?: boolean
}
