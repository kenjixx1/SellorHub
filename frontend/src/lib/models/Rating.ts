import type { RatingResponse, RatingBuyerInfo } from '../types'

export class Rating {
  id: number
  store_id: number
  buyer_id: number
  order_id: number | null
  score: number
  comment: string | null
  created_at: string
  updated_at: string
  buyer: RatingBuyerInfo | null

  constructor(dto: RatingResponse) {
    this.id = dto.id
    this.store_id = dto.store_id
    this.buyer_id = dto.buyer_id
    this.order_id = dto.order_id ?? null
    this.score = dto.score
    this.comment = dto.comment ?? null
    this.created_at = dto.created_at
    this.updated_at = dto.updated_at
    this.buyer = dto.buyer ?? null
  }

  hasComment(): boolean {
    return this.comment !== null && this.comment.trim().length > 0
  }

  shortComment(maxLen: number = 50): string {
    if (!this.comment) return ''
    if (this.comment.length <= maxLen) return this.comment
    return this.comment.substring(0, maxLen) + '…'
  }

  static fromDto(dto: RatingResponse): Rating {
    return new Rating(dto)
  }
}
