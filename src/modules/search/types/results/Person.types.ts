import { Types } from 'mongoose'

export interface PersonSearchResult {
  _id: Types.ObjectId
  name: string
  transName: string
  aliases: string[]
  image: string
}
