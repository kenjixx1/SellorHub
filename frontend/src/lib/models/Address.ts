import type { AddressResponse } from '../types'

export class Address {
  id: number
  label: string | null
  recipient_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  province: string
  postal_code: string
  country: string
  is_default: boolean
  user_id: number
  created_at: string

  constructor(dto: AddressResponse) {
    this.id = dto.id
    this.label = dto.label ?? null
    this.recipient_name = dto.recipient_name
    this.phone = dto.phone
    this.address_line1 = dto.address_line1
    this.address_line2 = dto.address_line2 ?? null
    this.city = dto.city
    this.province = dto.province
    this.postal_code = dto.postal_code
    this.country = dto.country
    this.is_default = dto.is_default
    this.user_id = dto.user_id
    this.created_at = dto.created_at
  }

  isDefault(): boolean {
    return this.is_default
  }

  oneLine(): string {
    const parts = [
      this.address_line1,
      this.address_line2,
      this.city,
      this.province,
      this.postal_code,
      this.country
    ].filter(Boolean)
    return parts.join(', ')
  }

  fullAddress(): string {
    return this.oneLine()
  }

  static fromDto(dto: AddressResponse): Address {
    return new Address(dto)
  }
}
