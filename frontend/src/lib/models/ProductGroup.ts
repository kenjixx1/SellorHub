import type { ProductGroup as ProductGroupDto } from '../types'

export class ProductGroup {
  id: number
  store_id: number
  name: string
  created_at: string
  product_count: number

  constructor(dto: ProductGroupDto) {
    this.id = dto.id
    this.store_id = dto.store_id
    this.name = dto.name
    this.created_at = dto.created_at
    this.product_count = dto.product_count
  }

  static fromDto(dto: ProductGroupDto): ProductGroup {
    return new ProductGroup(dto)
  }
}
