export interface ApiResponse<T> {
  success: boolean
  code: number
  version: string
  message: string
  data?: T
  cached?: boolean
  timestamp: number
}
