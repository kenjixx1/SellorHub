import type { CartResponse } from '../types'
import { CartItem } from './CartItem'

export class Cart {
  items: CartItem[]
  total_items: number
  total_price: number

  constructor(dto: CartResponse) {
    this.items = dto.items ? dto.items.map(CartItem.fromDto) : []
    this.total_items = dto.total_items
    this.total_price = dto.total_price
  }

  itemCount(): number {
    return this.total_items
  }

  formattedTotal(): string {
    return this.total_price.toLocaleString()
  }

  static fromDto(dto: CartResponse): Cart {
    return new Cart(dto)
  }
}
