import type { Inquiry as InquiryDto, InquiryStatus, InquiryProductInfo } from '../types'

export class Inquiry {
  id: number
  store_id: number
  product_id: number
  buyer_name: string
  buyer_email: string
  message: string
  status: InquiryStatus
  created_at: string
  product: InquiryProductInfo | null

  constructor(dto: InquiryDto) {
    this.id = dto.id
    this.store_id = dto.store_id
    this.product_id = dto.product_id
    this.buyer_name = dto.buyer_name
    this.buyer_email = dto.buyer_email
    this.message = dto.message
    this.status = dto.status
    this.created_at = dto.created_at
    this.product = dto.product ?? null
  }

  isNew(): boolean {
    return this.status === 'new'
  }

  isClosed(): boolean {
    return this.status === 'closed'
  }

  static fromDto(dto: InquiryDto): Inquiry {
    return new Inquiry(dto)
  }
}
