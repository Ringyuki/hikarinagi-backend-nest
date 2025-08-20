import { Types } from 'mongoose'

export interface TagSearchResult {
  _id: Types.ObjectId
  name: string
  description: string
}
