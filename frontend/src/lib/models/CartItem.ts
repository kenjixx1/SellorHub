import type { CartItem as CartItemDto, SellerProduct } from '../types'

export class CartItem {
  id: number
  user_id: number
  product_id: number
  quantity: number
  created_at: string
  product: SellerProduct & { image_url?: string | null }

  constructor(dto: CartItemDto) {
    this.id = dto.id
    this.user_id = dto.user_id
    this.product_id = dto.product_id
    this.quantity = dto.quantity
    this.created_at = dto.created_at
    this.product = dto.product
  }

  lineTotal(): number {
    const price = typeof this.product.price === 'string' 
      ? parseFloat(this.product.price) 
      : Number(this.product.price)
    
    if (isNaN(price)) return 0
    return price * this.quantity
  }

  title(): string {
    return this.product.title
  }

  static fromDto(dto: CartItemDto): CartItem {
    return new CartItem(dto)
  }
}
