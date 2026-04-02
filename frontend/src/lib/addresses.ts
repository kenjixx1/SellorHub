import { apiFetch } from './api'
import type { AddressResponse } from './types'

export async function getAddresses(token: string): Promise<AddressResponse[]> {
  return apiFetch('/api/addresses', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
}

export async function getAddress(token: string, id: number): Promise<AddressResponse> {
  return apiFetch(`/api/addresses/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
}
