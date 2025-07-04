import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { JwtService } from '@nestjs/jwt'
import { User, UserDocument } from '../schemas/user.schema'
import { CreateUserDto } from '../dto/create-user.dto'
import { LoginUserDto } from '../dto/login-user.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
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
    }
    const hikari_access_token = this.jwtService.sign(hikari_access_token_payload, {
      expiresIn: '1h',
      secret: process.env.JWT_SECRET,
    })

    const hikari_refresh_token_payload = {
      userId: user.userId,
    }
    const hikari_refresh_token = this.jwtService.sign(hikari_refresh_token_payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
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
    return user
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }
    return user
  }
}
