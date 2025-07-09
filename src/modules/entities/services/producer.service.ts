import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Producer, ProducerDocument } from '../schemas/producer.schema'

@Injectable()
export class ProducerService {
  constructor(@InjectModel(Producer.name) private producerModel: Model<ProducerDocument>) {}

  async findById(id: number): Promise<Producer | null> {
    return this.producerModel.findOne({ id }).exec()
  }
}
