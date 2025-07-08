import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { AppController } from './app.controller'

describe('AppController', () => {
  let controller: AppController

  const mockConfigService = {
    get: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
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
        version: '0.0.1',
        message: '',
        environment: expect.any(String),
        timestamp: expect.any(String),
      })
    })
  })

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = controller.getHealth()
      expect(result).toEqual({
        status: 'ok',
      })
    })
  })
})
