import { Types } from 'mongoose'

export interface ProducerSearchResult {
  _id: Types.ObjectId
  name: string
  transName: string
  aliases: string[]
  country: string
  image: string
}
