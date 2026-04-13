import { apiClient } from '../api'
import type { Inquiry } from '../types'

export type CreateInquiryPayload = {
  product_id: number
  buyer_name: string
  buyer_email: string
  message: string
}

export class InquiryService {
  async create(data: CreateInquiryPayload): Promise<Inquiry> {
    return apiClient.fetch<Inquiry>('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }
}

export const inquiryService = new InquiryService()
