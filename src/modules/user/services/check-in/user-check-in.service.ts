import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { CheckInRecord, CheckInRecordDocument } from '../../schemas/check-in/check-in-record.schema'
import { HikariPointService } from '../hikari-point.service'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { UserCheckInDto } from '../../dto/check-in/user-check-in.dto'
import { HikariPointRecordReason } from '../../types/hikari-point/HikariPointRecordReason'
import { User, UserDocument } from '../../schemas/user.schema'

@Injectable()
export class UserCheckInService {
  constructor(
    @InjectModel(CheckInRecord.name)
    private checkInRecordModel: Model<CheckInRecordDocument>,
    private hikariPointService: HikariPointService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async checkIn(dto: UserCheckInDto) {
    const { userId, isMakeUp } = dto

    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const isCheckIn = await this.checkIsCheckIn(userId)
    if (isCheckIn) {
      throw new BadRequestException('You have already checked in today')
    }

    const points = this.hikariPointService.generateRandomPoints(10, 1)

    await this.updateUserCheckInStreak(userId)

    const checkInRecord = new this.checkInRecordModel({
      userId,
      date: this.getDayStart(),
      points,
      isMakeUp,
      streakAfter: user.checkInStreak,
    })
    await checkInRecord.save()

    await this.hikariPointService.add({
      userId,
      amount: points,
      reason: HikariPointRecordReason.CHECK_IN_ADD,
    })

    const key = this.getCheckInKey(userId)
    const ttlRemaining = this.getTtlRemaining()
    await this.cacheManager.set(key, true, ttlRemaining)

    return {
      points,
    }
  }

  async checkIsCheckIn(userId: Types.ObjectId) {
    const key = this.getCheckInKey(userId)
    const cached = await this.cacheManager.get<boolean>(key)
    if (cached) return true

    const today = this.getDayStart()
    const exists = await this.checkInRecordModel.exists({ userId, date: today })
    if (exists) {
      await this.cacheManager.set(key, true, this.getTtlRemaining())
      return true
    }
    return false
  }

  async getCheckInRecord(userId: Types.ObjectId) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const records = await this.checkInRecordModel.find({
      userId,
      date: { $gte: monthStart, $lte: monthEnd },
    })

    return records
  }

  private async updateUserCheckInStreak(userId: Types.ObjectId) {
    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const now = new Date()
    const isYesterdayCheckIn =
      user.lastCheckInAt &&
      new Date(user.lastCheckInAt).toDateString() ===
        new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toDateString()

    const newStreak = isYesterdayCheckIn ? (user.checkInStreak || 0) + 1 : 1
    const longestStreak = Math.max(user.longestCheckInStreak, newStreak)

    user.checkInStreak = newStreak
    user.longestCheckInStreak = longestStreak
    user.lastCheckInAt = now
    await user.save()
  }

  private getFormattedDate(date: Date) {
    return date.toISOString().split('T')[0] // yyyy-mm-dd
  }

  private getDayStart(date = new Date()) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  private getTtlRemaining() {
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return Math.floor(tomorrow.getTime() - now.getTime())
  }

  private getCheckInKey(userId: Types.ObjectId) {
    const today = this.getFormattedDate(new Date())
    return `check_in:${userId.toString()}:${today}`
  }
}
