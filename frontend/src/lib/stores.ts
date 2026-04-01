import { apiFetch } from './api'
import type { SellerProduct, ProductGroup } from './seller'

export type StoreProfile = {
  id: number
  owner_id: number
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
  product_count?: number
  created_at: string
}

// ── Public store group + product types ───────────────────────────────────────

export type PublicStoreProduct = SellerProduct
export type PublicStoreGroup = ProductGroup

export type StoreProductsFilters = {
  group_id?: number
  min_price?: number
  max_price?: number
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'alphabetical'
  page?: number
  limit?: number
}

export type StoreProductsResponse = {
  products: PublicStoreProduct[]
  total: number
  page: number
  pages: number
}

// ── Public store list (directory) ────────────────────────────────────────────

export type StoreListFilters = {
  search?: string
  page?: number
  limit?: number
}

export type StoreListResponse = {
  items: StoreProfile[]
  total: number
  page: number
  pages: number
  limit: number
}

export async function listStores(filters: StoreListFilters = {}): Promise<StoreListResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.page != null) params.set('page', String(filters.page))
  if (filters.limit != null) params.set('limit', String(filters.limit))
  const qs = params.toString()
  return apiFetch<StoreListResponse>(`/api/stores${qs ? `?${qs}` : ''}`)
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

export async function getStoreGroups(slug: string): Promise<PublicStoreGroup[]> {
  return apiFetch<PublicStoreGroup[]>(`/api/stores/${slug}/groups`)
}

export async function getStoreProducts(
  slug: string,
  filters: StoreProductsFilters = {},
): Promise<StoreProductsResponse> {
  const params = new URLSearchParams()
  if (filters.group_id != null) params.set('group_id', String(filters.group_id))
  if (filters.min_price != null) params.set('min_price', String(filters.min_price))
  if (filters.max_price != null) params.set('max_price', String(filters.max_price))
  if (filters.sort_by) params.set('sort_by', filters.sort_by)
  if (filters.page != null) params.set('page', String(filters.page))
  if (filters.limit != null) params.set('limit', String(filters.limit))
  const qs = params.toString()
  return apiFetch<StoreProductsResponse>(`/api/stores/${slug}/products${qs ? `?${qs}` : ''}`)
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
