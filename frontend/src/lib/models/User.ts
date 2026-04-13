import type { User as UserDto } from '../types'

export class User {
  id: number
  username: string
  email: string
  role: 'buyer' | 'seller' | 'admin'
  full_name: string | null
  phone_number: string | null
  avatar_url: string | null
  selling_approve: boolean
  created_at: string

  constructor(dto: UserDto) {
    this.id = dto.id
    this.username = dto.username
    this.email = dto.email
    this.role = dto.role
    this.full_name = dto.full_name ?? null
    this.phone_number = dto.phone_number ?? null
    this.avatar_url = dto.avatar_url ?? null
    this.selling_approve = dto.selling_approve
    this.created_at = dto.created_at
  }

  static fromDto(dto: UserDto): User {
    return new User(dto)
  }
  
  isAdmin(): boolean {
    return this.role === 'admin'
  }
  
  isSeller(): boolean {
    return this.role === 'seller'
  }
}
