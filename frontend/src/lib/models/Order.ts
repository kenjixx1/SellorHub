import type { OrderResponse, OrderItemResponse } from '../types'
import { Address } from './Address'

export class Order {
  id: number
  order_number: string
  buyer_id: number
  store_id: number
  status: string
  total_amount: number
  currency: string
  shipping_address_id: number
  shipping_address: Address | null
  created_at: string
  updated_at: string
  items: OrderItemResponse[]

  constructor(dto: OrderResponse) {
    this.id = dto.id
    this.order_number = dto.order_number
    this.buyer_id = dto.buyer_id
    this.store_id = dto.store_id
    this.status = dto.status
    this.total_amount = dto.total_amount
    this.currency = dto.currency
    this.shipping_address_id = dto.shipping_address_id
    this.shipping_address = dto.shipping_address ? Address.fromDto(dto.shipping_address) : null
    this.created_at = dto.created_at
    this.updated_at = dto.updated_at
    this.items = dto.items || []
  }

  lineItemsCount(): number {
    return this.items.reduce((count, item) => count + item.quantity, 0)
  }

  formattedTotal(): string {
    return this.total_amount.toLocaleString()
  }

  statusLabel(): string {
    return this.status.charAt(0).toUpperCase() + this.status.slice(1).replace('_', ' ')
  }

  static fromDto(dto: OrderResponse): Order {
    return new Order(dto)
  }
}
