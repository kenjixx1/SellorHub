import type { PublicProduct, SellerProduct, ProductImage, ProductStatus } from '../types'

export class Product {
  id: number
  store_id: number
  title: string
  description: string | null
  price: string
  stock: number | null
  status: ProductStatus
  group_id: number | null
  created_at: string
  updated_at: string
  images: ProductImage[]
  store_name?: string
  store_slug?: string

  constructor(dto: PublicProduct | SellerProduct) {
    this.id = dto.id
    this.store_id = dto.store_id
    this.title = dto.title
    this.description = dto.description ?? null
    this.price = dto.price
    this.stock = dto.stock ?? null
    this.status = dto.status
    this.group_id = dto.group_id ?? null
    this.created_at = dto.created_at
    this.updated_at = dto.updated_at
    this.images = dto.images || []
    
    if ('store_name' in dto) {
      this.store_name = dto.store_name
    }
    if ('store_slug' in dto) {
      this.store_slug = dto.store_slug
    }
  }

  static fromDto(dto: PublicProduct | SellerProduct): Product {
    return new Product(dto)
  }

  formattedPrice(): string {
    return parseFloat(this.price).toLocaleString()
  }

  primaryImage(): string | null {
    if (this.images && this.images.length > 0) {
      return this.images[0].image_url
    }
    return null
  }
}
