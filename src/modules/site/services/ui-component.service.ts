import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { UIComponent, UIComponentDocument } from '../schemas/ui-component.schema'
import { GetUIComponentDto } from '../dto/get-ui-component.dto'
import { UpdateUIComponentDto } from '../dto/update-ui-component.dto'
import { CreateUIComponentDto } from '../dto/create-ui-component.dto'

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

    if (components.length === 0) {
      throw new NotFoundException('No components found')
    }

    return components
  }

  async update(dto: UpdateUIComponentDto) {
    const { type, page, position } = dto
    const query: FilterQuery<UIComponentDocument> = { type, page }

    if (position) {
      query.position = position
    }
    const component = await this.uiComponentModel.findOne(query)
    if (!component) {
      throw new NotFoundException('Component not found')
    }

    const updatedComponent = await this.uiComponentModel.findOneAndUpdate(
      query,
      { $set: dto },
      { new: true },
    )
    return updatedComponent
  }

  async create(dto: CreateUIComponentDto) {
    const { type, page, position, section } = dto
    const query: FilterQuery<UIComponentDocument> = { type, page }
    if (position) {
      query.position = position
    }
    if (section) {
      query.section = section
    }
    const existingComponent = await this.uiComponentModel.findOne(query)
    if (existingComponent) {
      throw new ConflictException('Component already exists')
    }

    const component = await this.uiComponentModel.create(dto)
    return component
  }
}
