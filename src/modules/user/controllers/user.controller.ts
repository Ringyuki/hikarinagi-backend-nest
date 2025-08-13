import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  Headers,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common'
import { UserService } from '../services/user.service'
import { VerificationForSignupDto, CreateUserDto, LoginUserDto, RefreshTokenDto } from '../dto/user'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface'
import { HikariUserGroup } from '../../auth/enums/hikari-user-group.enum'
import { Roles } from '../../auth/decorators/roles.decorator'
import { VerificationService } from '../../email/services/verification.service'
import { UpdateUserEmailDto } from '../dto/user/update-user-email.dto'

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
  ) {}

  @Post('verification-for-signup')
  async verificationForSignup(@Body() verificationForSignupDto: VerificationForSignupDto) {
    const result = await this.userService.sendVerificationEmailForSignUp(verificationForSignupDto)
    return {
      data: result,
      message: 'verification email sent',
    }
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto)
    return {
      data: user,
      message: 'register success',
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto, @Headers('user-agent') userAgent: string) {
    const result = await this.userService.login(loginUserDto, userAgent)
    return {
      data: result,
    }
  }

  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.userService.refreshToken(refreshTokenDto)
    return {
      data: result,
      message: 'token refreshed',
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: RequestWithUser, @Body() refreshTokenDto: RefreshTokenDto) {
    await this.userService.logout(refreshTokenDto.refreshToken, req.user.userId)
    return {
      message: 'logout success',
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(HikariUserGroup.USER)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return {
      data: req.user,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Roles(HikariUserGroup.ADMIN)
  @Get(':username')
  async findByUsername(@Param('username') username: string) {
    const user = await this.userService.findByUsername(username)
    return {
      data: user,
    }
  }

  @Post('change-email/request')
  async requestUpdateEmail(@Req() req: RequestWithUser) {
    const { uuid } = await this.userService.requestUpdateEmail(req)
    return {
      data: {
        uuid,
      },
      message: 'verification email sent',
    }
  }

  @Post('change-email/update')
  async updateEmail(@Req() req: RequestWithUser, @Body() updateUserEmailDto: UpdateUserEmailDto) {
    await this.userService.updateEmail(req, updateUserEmailDto)
    return {
      message: 'email updated',
    }
  }
}
