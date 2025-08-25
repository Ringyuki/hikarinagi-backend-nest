import { Injectable } from '@nestjs/common'
import { UIComponentService } from '../ui-component.service'
import { UpdateAdComponentDto } from '../../dto/update-ui-component.dto'
import { UIComponentType } from '../../enums/UIComponentType.enum'
import { CreateUIComponentDto } from '../../dto/create-ui-component.dto'
import { AdComponent } from '../../types/components/AdComponent.types'

@Injectable()
export class AdComponentService {
  constructor(private uiComponentService: UIComponentService) {}

  async updateAdComponent(dto: UpdateAdComponentDto) {
    return this.uiComponentService.update({ ...dto, type: UIComponentType.ADVERTISEMENT })
  }

  async getAds(page: string, position?: string) {
    const ads = await this.uiComponentService.findAll({
      type: UIComponentType.ADVERTISEMENT,
      page,
      position,
    })

    return (ads[0] as unknown as AdComponent).items
  }

  async createAdComponent(dto: CreateUIComponentDto) {
    return this.uiComponentService.create({ ...dto, type: UIComponentType.ADVERTISEMENT })
  }
}
