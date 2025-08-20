import { Types } from 'mongoose'

export interface CharacterSearchResult {
  _id: Types.ObjectId
  name: string
  transName: string
  aliases: string[]
  image: string
}
