import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Person, PersonDocument } from '../schemas/person.schema'

@Injectable()
export class PersonService {
  constructor(@InjectModel(Person.name) private personModel: Model<PersonDocument>) {}

  async findById(id: number): Promise<Person | null> {
    return this.personModel.findOne({ id }).exec()
  }
}
