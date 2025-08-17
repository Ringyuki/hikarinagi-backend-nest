import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  HikariPointsRecoder,
  HikariPointsRecoderDocument,
} from '../schemas/hikari-point-recoder.schema'
import { UserDocument, User } from '../schemas/user.schema'
import { ChangeHikariPointDto } from '../dto/hikari-point/change-hikari-point.dto'

@Injectable()
export class HikariPointService {
  constructor(
    @InjectModel(HikariPointsRecoder.name)
    private hikariPointsRecoderModel: Model<HikariPointsRecoderDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async add(dto: ChangeHikariPointDto) {
    return this.change(dto, 'add')
  }

  async subtract(dto: ChangeHikariPointDto) {
    return this.change(dto, 'subtract')
  }

  async getBalance(userId: string) {
    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user.hikariPoint
  }

  private async change(dto: ChangeHikariPointDto, action: 'add' | 'subtract') {
    const { userId, amount, reason } = dto

    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    user.hikariPoint += action === 'add' ? amount : -amount
    await user.save()

    const balance = user.hikariPoint
    const hikariPointsRecoder = new this.hikariPointsRecoderModel({
      action,
      userId,
      amount,
      reason,
      balance,
    })
    await hikariPointsRecoder.save()

    return balance
  }
}
