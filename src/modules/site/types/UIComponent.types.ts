import { UIComponentType } from '../enums/UIComponentType.enum'

export interface UIComponent {
  type: UIComponentType
  page: string
  position?: string
  note?: string
  section?: string
  createdBy?: string
}
