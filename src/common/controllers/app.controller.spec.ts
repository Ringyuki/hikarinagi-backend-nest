import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { AppController } from './app.controller'
import { VersionService } from '../services/version.service'

describe('AppController', () => {
  let controller: AppController

  const mockConfigService = {
    get: jest.fn(),
  }

  const mockVersionService = {
    getVersion: jest.fn().mockReturnValue('2.0.123-alpha.abc123'),
    getVersionInfo: jest.fn().mockResolvedValue({
      version: '2.0.123-alpha.abc123',
      commitHash: 'abc123',
      commitCount: 123,
      generatedAt: new Date(),
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: VersionService,
          useValue: mockVersionService,
        },
      ],
    }).compile()

    controller = module.get<AppController>(AppController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getAppInfo', () => {
    it('should return app information', () => {
      const result = controller.getAppInfo()
      expect(result).toEqual({
        name: 'Hikarinagi backend nestjs',
        version: '2.0.123-alpha.abc123',
        message: '',
        environment: expect.any(String),
        timestamp: expect.any(String),
      })
      expect(mockVersionService.getVersion).toHaveBeenCalled()
    })
  })

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = controller.getHealth()
      expect(result).toEqual({
        status: 'ok',
        version: '2.0.123-alpha.abc123',
      })
      expect(mockVersionService.getVersion).toHaveBeenCalled()
    })
  })
})
