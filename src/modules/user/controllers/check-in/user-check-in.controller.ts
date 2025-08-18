import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { UserCheckInService } from '../../services/check-in/user-check-in.service'
import { RequestWithUser } from '../../../auth/interfaces/request-with-user.interface'
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard'
import { Types } from 'mongoose'

@Controller('user/check-in')
export class UserCheckInController {
  constructor(private readonly userCheckInService: UserCheckInService) {}

  @Post('')
  @UseGuards(JwtAuthGuard)
  async checkIn(@Req() req: RequestWithUser) {
    const { points } = await this.userCheckInService.checkIn({
      userId: new Types.ObjectId(req.user._id),
      isMakeUp: false,
    })
    return {
      message: 'check in success',
      data: {
        points,
      },
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async checkInStatus(@Req() req: RequestWithUser) {
    const status = await this.userCheckInService.checkIsCheckIn(new Types.ObjectId(req.user._id))
    const streak = await this.userCheckInService.getCheckInStreak(new Types.ObjectId(req.user._id))
    return {
      data: {
        isCheckIn: status,
        streak,
      },
    }
  }

  @Get('records')
  @UseGuards(JwtAuthGuard)
  async getCheckInRecord(@Req() req: RequestWithUser) {
    const records = await this.userCheckInService.getCheckInRecord(new Types.ObjectId(req.user._id))
    return {
      data: records,
    }
  }
}
