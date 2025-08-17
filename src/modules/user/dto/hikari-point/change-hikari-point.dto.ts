import { IsEnum, IsNotEmpty, IsNumber, IsMongoId, IsOptional } from 'class-validator'
import { HikariPointRecordReason } from '../../types/hikari-point/HikariPointRecordReason'
import { HikariPointAction } from '../../types/hikari-point/HikariPointAction'
import { Types } from 'mongoose'

export class ChangeHikariPointDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: Types.ObjectId

  @IsEnum(HikariPointAction)
  @IsOptional()
  action?: HikariPointAction

  @IsNumber()
  @IsNotEmpty()
  amount: number

  @IsEnum(HikariPointRecordReason)
  @IsNotEmpty()
  reason: HikariPointRecordReason
}
