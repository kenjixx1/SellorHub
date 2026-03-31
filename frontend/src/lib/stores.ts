import { apiFetch } from './api'

export type StoreProfile = {
  id: number
  seller_id: number
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
  created_at: string
}

export type CreateStorePayload = {
  name: string
  slug: string
  description?: string
  logo_url?: string
}

export type UpdateStorePayload = {
  name?: string
  description?: string
  logo_url?: string
}

export async function getStoreProfile(slug: string): Promise<StoreProfile> {
  return apiFetch<StoreProfile>(`/api/stores/${slug}`)
}

export async function createStore(token: string, data: CreateStorePayload): Promise<StoreProfile> {
  return apiFetch<StoreProfile>('/api/stores', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function updateStore(token: string, data: UpdateStorePayload): Promise<StoreProfile> {
  return apiFetch<StoreProfile>('/api/stores/me', {
    method: 'PUT',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}
