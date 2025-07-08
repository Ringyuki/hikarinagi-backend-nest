import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { CounterService } from './counter.service'
import { Counter } from '../schemas/counter.schema'

describe('CounterService', () => {
  let service: CounterService

  const mockCounterModel = {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CounterService,
        {
          provide: getModelToken(Counter.name),
          useValue: mockCounterModel,
        },
      ],
    }).compile()

    service = module.get<CounterService>(CounterService)

    // Mock the logger since it's created in the service constructor
    jest.spyOn(service['logger'], 'debug').mockImplementation()
    jest.spyOn(service['logger'], 'error').mockImplementation()
    jest.spyOn(service['logger'], 'log').mockImplementation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getNextSequence', () => {
    it('should return next sequence number for existing counter', async () => {
      const counterName = 'userId'
      const expectedSeq = 10001

      const mockResult = {
        seq: expectedSeq,
        save: jest.fn(),
      }

      mockCounterModel.findOneAndUpdate.mockResolvedValueOnce(mockResult)

      const result = await service.getNextSequence(counterName)

      expect(result).toBe(expectedSeq)
      expect(mockCounterModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: counterName },
        { $inc: { seq: 1 } },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
    })

    it('should initialize new counter with custom initial value', async () => {
      const counterName = 'userId'
      const initialValue = 5000

      const mockResult = {
        seq: 1, // New counter starts at 1
        save: jest.fn().mockResolvedValueOnce(undefined),
      }

      mockCounterModel.findOneAndUpdate.mockResolvedValueOnce(mockResult)

      const result = await service.getNextSequence(counterName, initialValue)

      expect(result).toBe(initialValue)
      expect(mockResult.seq).toBe(initialValue)
      expect(mockResult.save).toHaveBeenCalled()
    })

    it('should use default initial value when not provided', async () => {
      const counterName = 'userId'

      const mockResult = {
        seq: 1, // New counter starts at 1
        save: jest.fn().mockResolvedValueOnce(undefined),
      }

      mockCounterModel.findOneAndUpdate.mockResolvedValueOnce(mockResult)

      const result = await service.getNextSequence(counterName)

      expect(result).toBe(10000) // Default initial value
      expect(mockResult.seq).toBe(10000)
    })

    it('should handle database errors', async () => {
      const counterName = 'userId'

      mockCounterModel.findOneAndUpdate.mockRejectedValueOnce(new Error('Database error'))

      await expect(service.getNextSequence(counterName)).rejects.toThrow(
        'Failed to generate sequence for userId',
      )
    })
  })

  describe('getCurrentValue', () => {
    it('should return current counter value', async () => {
      const counterName = 'userId'
      const expectedValue = 12345

      const mockCounter = {
        seq: expectedValue,
      }

      mockCounterModel.findOne.mockResolvedValueOnce(mockCounter)

      const result = await service.getCurrentValue(counterName)

      expect(result).toBe(expectedValue)
      expect(mockCounterModel.findOne).toHaveBeenCalledWith({ _id: counterName })
    })

    it('should return 0 for non-existent counter', async () => {
      const counterName = 'nonExistentCounter'

      mockCounterModel.findOne.mockResolvedValueOnce(null)

      const result = await service.getCurrentValue(counterName)

      expect(result).toBe(0)
    })
  })

  describe('resetCounter', () => {
    it('should reset counter to specified value', async () => {
      const counterName = 'userId'
      const newValue = 20000

      mockCounterModel.findOneAndUpdate.mockResolvedValueOnce({})

      await service.resetCounter(counterName, newValue)

      expect(mockCounterModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: counterName },
        { seq: newValue },
        { upsert: true },
      )
    })

    it('should log reset operation', async () => {
      const counterName = 'userId'
      const newValue = 20000

      mockCounterModel.findOneAndUpdate.mockResolvedValueOnce({})

      await service.resetCounter(counterName, newValue)

      expect(service['logger'].log).toHaveBeenCalledWith(
        `Counter ${counterName} reset to ${newValue}`,
      )
    })
  })
})
