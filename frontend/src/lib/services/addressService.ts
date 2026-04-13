import { apiClient } from '../api'
import type { AddressResponse } from '../types'

export type CreateAddressPayload = {
  recipient_name: string
  phone: string
  address_line1: string
  address_line2?: string | null
  city: string
  province: string
  postal_code: string
  country?: string
  is_default?: boolean
  label?: string
}

export type UpdateAddressPayload = Partial<CreateAddressPayload>

export class AddressService {
  async getAll(token: string): Promise<AddressResponse[]> {
    return apiClient.fetch<AddressResponse[]>('/api/addresses', { token })
  }

  async getById(token: string, id: number): Promise<AddressResponse> {
    return apiClient.fetch<AddressResponse>(`/api/addresses/${id}`, { token })
  }

  async create(token: string, data: CreateAddressPayload): Promise<AddressResponse> {
    return apiClient.fetch<AddressResponse>('/api/addresses', {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }

  async update(token: string, id: number, data: UpdateAddressPayload): Promise<AddressResponse> {
    return apiClient.fetch<AddressResponse>(`/api/addresses/${id}`, {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }

  async delete(token: string, id: number): Promise<void> {
    return apiClient.fetch<void>(`/api/addresses/${id}`, {
      method: 'DELETE',
      token
    })
  }

  async setDefault(token: string, id: number): Promise<AddressResponse> {
    return apiClient.fetch<AddressResponse>(`/api/addresses/${id}`, {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true })
    })
  }
}

export const addressService = new AddressService()
