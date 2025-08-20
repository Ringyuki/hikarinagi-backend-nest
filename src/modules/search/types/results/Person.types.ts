import { Types } from 'mongoose'

export interface PersonSearchResult {
  _id: Types.ObjectId
  name: string
  transName: string
  alias: string[]
  image: string
}
