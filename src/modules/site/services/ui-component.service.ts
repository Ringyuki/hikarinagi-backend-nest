import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { UIComponent, UIComponentDocument } from '../schemas/ui-component.schema'
import { GetUIComponentDto } from '../dto/get-ui-component.dto'

@Injectable()
export class UIComponentService {
  constructor(
    @InjectModel(UIComponent.name) private uiComponentModel: Model<UIComponentDocument>,
  ) {}

  async findAll(dto: GetUIComponentDto) {
    const { type, page, position } = dto
    const query: FilterQuery<UIComponentDocument> = { type }
    if (page) {
      query.page = page
    }
    if (position) {
      query.position = position
    }

    const components = await this.uiComponentModel.find(query)
    return components
  }
}
