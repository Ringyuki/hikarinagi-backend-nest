import { IsEnum, IsNotEmpty, IsNumber, IsString, IsMongoId, IsOptional } from 'class-validator'

enum HikariPointAction {
  ADD = 'add',
  SUBTRACT = 'subtract',
}

export class ChangeHikariPointDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string

  @IsEnum(HikariPointAction)
  @IsOptional()
  action?: HikariPointAction

  @IsNumber()
  @IsNotEmpty()
  amount: number

  @IsString()
  @IsNotEmpty()
  reason: string
}
