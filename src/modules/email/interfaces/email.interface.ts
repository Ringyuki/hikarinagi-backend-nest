export interface EmailConfig {
  provider: 'elastic' | 'postal'
  apiKey: string
  endPoint: string
  senderAddress: string
  senderName: string
}

export interface VerificationCodeData {
  email: string
  code: string
  type: string
  createdAt: number
}
