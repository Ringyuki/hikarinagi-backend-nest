import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import * as mongoose from 'mongoose'
import { JwtService } from '@nestjs/jwt'
import { User, UserDocument } from '../schemas/user.schema'
import { UserSetting, UserSettingDocument } from '../schemas/user-setting.schema'
import { CreateUserDto } from '../dto/user/create-user.dto'
import { LoginUserDto } from '../dto/user/login-user.dto'
import { RefreshTokenDto } from '../dto/user/refresh-token.dto'
import { HikariConfigService } from '../../../common/config'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserSetting.name) private userSettingModel: Model<UserSettingDocument>,
    private jwtService: JwtService,
    private configService: HikariConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUsername = await this.userModel.findOne({
      username: createUserDto.username,
    })
    if (existingUsername) {
      throw new ConflictException('用户名已被使用')
    }

    const existingEmail = await this.userModel.findOne({
      email: createUserDto.email,
    })
    if (existingEmail) {
      throw new ConflictException('邮箱已被注册')
    }

    const createdUser = new this.userModel(createUserDto)

    // 初始化user setting
    const userSetting = new this.userSettingModel({
      user: createdUser._id,
    })
    const savedUserSetting = await userSetting.save()
    createdUser.setting = savedUserSetting._id as mongoose.Types.ObjectId

    return createdUser.save()
  }

  async login(
    loginUserDto: LoginUserDto,
    userAgent?: string,
  ): Promise<{
    hikariAccessToken: string
    hikariRefreshToken: string
    user: { name: string; userId: string }
  }> {
    const { identifier, password } = loginUserDto

    const user = await this.userModel.findOne({
      $or: [{ name: identifier }, { email: identifier }],
    })

    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    const userSetting = await this.userSettingModel.findOne({ user: user._id })

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误')
    }

    const hikari_access_token_payload = {
      _id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      hikariUserGroup: user.hikariUserGroup,
      userSetting,
    }
    const hikari_access_token = this.jwtService.sign(hikari_access_token_payload, {
      expiresIn: this.configService.get('jwt.hikariAccessTokenExpiresIn'),
      secret: this.configService.get('jwt.secret'),
    })

    const hikari_refresh_token_payload = {
      userId: user.userId,
    }
    const hikari_refresh_token = this.jwtService.sign(hikari_refresh_token_payload, {
      expiresIn: this.configService.get('jwt.hikariRefreshTokenExpiresIn'),
      secret: this.configService.get('jwt.refreshSecret'),
    })

    // 保存 refresh token
    user.hikariRefreshToken.push({
      token: hikari_refresh_token,
      deviceInfo: userAgent || 'Unknown',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    await user.save()

    return {
      hikariAccessToken: hikari_access_token,
      hikariRefreshToken: hikari_refresh_token,
      user: {
        name: user.name,
        userId: user.userId,
      },
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
    hikariAccessToken: string
  }> {
    let decoded = null
    try {
      decoded = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      })
    } catch {
      throw new UnauthorizedException('无效的 refreshToken')
    }
    const user = await this.userModel.findOne({ userId: decoded.userId })
    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    const tokenIndex = user.hikariRefreshToken.findIndex(
      token => token.token === refreshTokenDto.refreshToken,
    )
    if (tokenIndex === -1) {
      throw new UnauthorizedException('无效的 refreshToken')
    }

    const hikariAccessTokenPayload = {
      _id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      hikariUserGroup: user.hikariUserGroup,
    }
    const hikariAccessToken = this.jwtService.sign(hikariAccessTokenPayload, {
      expiresIn: this.configService.get('jwt.hikariAccessTokenExpiresIn'),
      secret: this.configService.get('jwt.secret'),
    })

    return {
      hikariAccessToken,
    }
  }

  async logout(hikariRefreshToken: string, userId: string): Promise<void> {
    const user = await this.userModel.findOne({ userId })
    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    const tokenIndex = user.hikariRefreshToken.findIndex(
      token => token.token === hikariRefreshToken,
    )
    if (tokenIndex === -1) {
      throw new UnauthorizedException('无效的 refreshToken')
    }

    user.hikariRefreshToken.splice(tokenIndex, 1)
    await user.save()
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id)
    if (!user) {
      throw new NotFoundException('用户不存在')
    }
    return user
  }

  async findByUsername(username: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ name: username })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }
    return user.toJSON({ includeEmail: true, includeStatus: true, include_id: false })
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }
    return user
  }
}
