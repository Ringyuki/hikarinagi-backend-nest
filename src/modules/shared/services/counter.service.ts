import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Counter, CounterDocument } from '../schemas/counter.schema'
import { CounterNameType } from '../types/couters.type'

@Injectable()
export class CounterService {
  private readonly logger = new Logger(CounterService.name)

  constructor(@InjectModel(Counter.name) private counterModel: Model<CounterDocument>) {}

  async getNextSequence(counterName: CounterNameType, initialValue = 10000): Promise<number> {
    try {
      const result = await this.counterModel.findOneAndUpdate(
        { _id: counterName },
        { $inc: { seq: 1 } },
        {
          new: true,
          upsert: true, // 如果文档不存在则创建
          setDefaultsOnInsert: true,
        },
      )

      // 如果文档是新创建的，并且 seq 是初始值，手动调整为 initialValue
      if (result.seq === 1) {
        result.seq = initialValue
        await result.save()
        return initialValue
      }

      this.logger.debug(`Generated ${counterName}: ${result.seq}`)
      return result.seq
    } catch (error) {
      this.logger.error(`Failed to get next sequence for ${counterName}:`, error)
      throw new Error(`Failed to generate sequence for ${counterName}`)
    }
  }

  async getCurrentValue(counterName: string): Promise<number> {
    const counter = await this.counterModel.findOne({ _id: counterName })
    return counter?.seq || 0
  }

  async resetCounter(counterName: string, value: number): Promise<void> {
    await this.counterModel.findOneAndUpdate({ _id: counterName }, { seq: value }, { upsert: true })
    this.logger.log(`Counter ${counterName} reset to ${value}`)
  }
}
