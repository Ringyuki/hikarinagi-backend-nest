import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import * as mongoose from 'mongoose'
import { JwtService } from '@nestjs/jwt'
import { User, UserDocument } from '../schemas/user.schema'
import { UserSetting, UserSettingDocument } from '../schemas/user-setting.schema'
import { VerificationForSignupDto, CreateUserDto, LoginUserDto, RefreshTokenDto } from '../dto/user'
import { HikariConfigService } from '../../../common/config/configs'
import { VerificationService } from '../../email/services/verification.service'
import { CounterService } from '../../shared/services/counter.service'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserSetting.name) private userSettingModel: Model<UserSettingDocument>,
    private jwtService: JwtService,
    private configService: HikariConfigService,
    private verificationService: VerificationService,
    private counterService: CounterService,
  ) {}
  async sendVerificationEmailForSignUp(verificationForSignupDto: VerificationForSignupDto) {
    if (!this.configService.get('allowRegister')) {
      throw new ForbiddenException('注册已关闭')
    }

    const existingName = await this.userModel.findOne({
      name: verificationForSignupDto.name,
      isVerified: true,
    })
    if (existingName) {
      throw new ConflictException('用户名已被使用')
    }
    const existingEmail = await this.userModel.findOne({
      email: verificationForSignupDto.email,
      isVerified: true,
    })
    if (existingEmail) {
      throw new ConflictException('邮箱已被注册')
    }
    const exsitedUnVerifiedUser = await this.userModel.findOne({
      email: verificationForSignupDto.email,
      isVerified: false,
    })
    if (!exsitedUnVerifiedUser) {
      await this.userModel.create({
        email: verificationForSignupDto.email,
        isVerified: false,
      })
    }

    const result = await this.verificationService.requestVerificationCode(
      verificationForSignupDto.email,
      'register',
    )
    return {
      uuid: result.uuid,
      email: verificationForSignupDto.email,
      type: 'register',
    }
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    if (!this.configService.get('allowRegister')) {
      throw new ForbiddenException('注册已关闭')
    }

    const existingName = await this.userModel.findOne({
      name: createUserDto.name,
      isVerified: true,
    })
    if (existingName) {
      throw new ConflictException('用户名已被使用')
    }
    const existingEmail = await this.userModel.findOne({
      email: createUserDto.email,
      isVerified: true,
    })
    if (existingEmail) {
      throw new ConflictException('邮箱已被注册')
    }

    const result = await this.verificationService.verifyCode({
      email: createUserDto.email,
      code: createUserDto.code,
      uuid: createUserDto.uuid,
    })
    if (!result.verified) {
      throw new ForbiddenException(result.message)
    }

    const existingUnVerifiedUser = await this.userModel.findOne({
      email: createUserDto.email,
      isVerified: false,
    })
    if (!existingUnVerifiedUser) {
      const userId = (await this.counterService.getNextSequence('userId')).toString()
      const createdUser = new this.userModel({
        ...createUserDto,
        // uuid交给pre validate生成
        uuid: '',
        userId,
        isVerified: true,
      })
      const savedUser = await createdUser.save()
      const userSetting = new this.userSettingModel({
        user: savedUser._id,
      })
      const savedUserSetting = await userSetting.save()
      savedUser.setting = savedUserSetting._id as mongoose.Types.ObjectId
      return savedUser.toJSON({ includeEmail: true, includeStatus: false, notInclude_id: true })
    } else {
      existingUnVerifiedUser.password = createUserDto.password
      existingUnVerifiedUser.name = createUserDto.name
      existingUnVerifiedUser.userId = (
        await this.counterService.getNextSequence('userId')
      ).toString()
      existingUnVerifiedUser.isVerified = true
      await existingUnVerifiedUser.save()
      return existingUnVerifiedUser.toJSON({
        includeEmail: true,
        includeStatus: false,
        notInclude_id: true,
      })
    }
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
      isVerified: true,
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
    const userSetting = await this.userSettingModel.findOne({ user: user._id })

    const hikariAccessTokenPayload = {
      _id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      hikariUserGroup: user.hikariUserGroup,
      userSetting,
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
    return user.toJSON({ includeEmail: true, includeStatus: true, notInclude_id: true })
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }
    return user
  }
}
