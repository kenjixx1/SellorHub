import type { StoreProfile } from '../types'

export class Store {
  id: number
  owner_id: number
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  product_count: number
  created_at: string

  constructor(dto: StoreProfile) {
    this.id = dto.id
    this.owner_id = dto.owner_id
    this.name = dto.name
    this.slug = dto.slug
    this.description = dto.description ?? null
    this.logo_url = dto.logo_url ?? null
    this.product_count = dto.product_count ?? 0
    this.created_at = dto.created_at
  }

  static fromDto(dto: StoreProfile): Store {
    return new Store(dto)
  }
}
