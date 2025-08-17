import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  HikariPointsRecord,
  HikariPointsRecordDocument,
} from '../schemas/hikari-point-record.schema'
import { UserDocument, User } from '../schemas/user.schema'
import { ChangeHikariPointDto } from '../dto/hikari-point/change-hikari-point.dto'
import { HikariPointAction } from '../types/hikari-point/HikariPointAction'

@Injectable()
export class HikariPointService {
  constructor(
    @InjectModel(HikariPointsRecord.name)
    private hikariPointsRecordModel: Model<HikariPointsRecordDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async add(dto: ChangeHikariPointDto) {
    return this.change(dto, HikariPointAction.ADD)
  }

  async subtract(dto: ChangeHikariPointDto) {
    return this.change(dto, HikariPointAction.SUBTRACT)
  }

  async getBalance(userId: string) {
    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user.hikariPoint
  }

  generateRandomPoints(max: number, min: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  private async change(dto: ChangeHikariPointDto, action: HikariPointAction) {
    const { userId, amount, reason } = dto

    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    user.hikariPoint += action === HikariPointAction.ADD ? amount : -amount
    await user.save()

    const balance = user.hikariPoint
    const hikariPointsRecord = new this.hikariPointsRecordModel({
      action,
      userId,
      amount,
      reason,
      balance,
    })
    await hikariPointsRecord.save()

    return balance
  }
}
