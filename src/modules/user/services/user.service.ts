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
    // 检查用户名是否存在
    const existingUsername = await this.userModel.findOne({ username: createUserDto.username })
    if (existingUsername) {
      throw new ConflictException('用户名已被使用')
    }

    // 检查邮箱是否存在
    const existingEmail = await this.userModel.findOne({ email: createUserDto.email })
    if (existingEmail) {
      throw new ConflictException('邮箱已被注册')
    }

    // 创建新用户
    const createdUser = new this.userModel(createUserDto)
    return createdUser.save()
  }

  async login(loginUserDto: LoginUserDto): Promise<{ access_token: string; user: UserDocument }> {
    const { identifier, password } = loginUserDto

    // 查找用户（通过用户名或邮箱）
    const user = await this.userModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    })

    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误')
    }

    // 生成JWT
    const payload = { sub: user._id, username: user.username, role: user.role }
    return {
      access_token: this.jwtService.sign(payload),
      user,
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
    const user = await this.userModel.findOne({ username })
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
