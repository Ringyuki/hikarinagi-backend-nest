import { Test, TestingModule } from '@nestjs/testing'
import { VerificationService } from '../../email/services/verification.service'
import { UserController } from './user.controller'
import { UserService } from '../services/user.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { UserCheckInService } from '../services/check-in/user-check-in.service'

describe('UserController', () => {
  let controller: UserController

  const mockUserService = {
    sendVerificationEmailForSignUp: jest.fn(),
    create: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    findByUsername: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: VerificationService,
          useValue: { requestVerificationCode: jest.fn(), verifyCode: jest.fn() },
        },
        {
          provide: UserCheckInService,
          useValue: { checkIn: jest.fn(), checkIsCheckIn: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<UserController>(UserController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('verificationForSignup', () => {
    it('should send verification email for signup', async () => {
      const dto = { email: 'test@test.com', name: 'testuser' }
      const mockResult = { uuid: 'test-uuid', email: 'test@test.com', type: 'register' }

      mockUserService.sendVerificationEmailForSignUp.mockResolvedValue(mockResult)

      const result = await controller.verificationForSignup(dto)

      expect(result).toEqual({
        data: mockResult,
        message: 'verification email sent',
      })
      expect(mockUserService.sendVerificationEmailForSignUp).toHaveBeenCalledWith(dto)
    })
  })
})
