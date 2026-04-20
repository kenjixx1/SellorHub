import { apiClient } from '../api'
import type { StoreProfile, ProductGroup, StoreListFilters, StoreListResponse, StoreProductsFilters, StoreProductsResponse } from '../types'

export type SlugCheckResponse = {
  slug: string
  valid: boolean
  available: boolean
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

export class StoreService {
  async listStores(filters: StoreListFilters = {}): Promise<StoreListResponse> {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.page != null) params.set('page', String(filters.page))
    if (filters.limit != null) params.set('limit', String(filters.limit))
    const qs = params.toString()
    return apiClient.fetch<StoreListResponse>(`/api/stores${qs ? `?${qs}` : ''}`)
  }

  async getProfile(slug: string): Promise<StoreProfile> {
    return apiClient.fetch<StoreProfile>(`/api/stores/${slug}`)
  }

  async getGroups(slug: string): Promise<ProductGroup[]> {
    return apiClient.fetch<ProductGroup[]>(`/api/stores/${slug}/groups`)
  }

  async getProducts(slug: string, filters: StoreProductsFilters = {}): Promise<StoreProductsResponse> {
    const params = new URLSearchParams()
    if (filters.group_id != null) params.set('group_id', String(filters.group_id))
    if (filters.min_price != null) params.set('min_price', String(filters.min_price))
    if (filters.max_price != null) params.set('max_price', String(filters.max_price))
    if (filters.sort_by) params.set('sort_by', filters.sort_by)
    if (filters.page != null) params.set('page', String(filters.page))
    if (filters.limit != null) params.set('limit', String(filters.limit))
    const qs = params.toString()
    return apiClient.fetch<StoreProductsResponse>(`/api/stores/${slug}/products${qs ? `?${qs}` : ''}`)
  }

  async checkSlug(slug: string): Promise<SlugCheckResponse> {
    return apiClient.fetch<SlugCheckResponse>(
      `/api/stores/check-slug?slug=${encodeURIComponent(slug)}`
    )
  }

  async create(token: string, data: CreateStorePayload): Promise<StoreProfile> {
    return apiClient.fetch<StoreProfile>('/api/stores', {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async update(token: string, data: UpdateStorePayload): Promise<StoreProfile> {
    return apiClient.fetch<StoreProfile>('/api/stores/me', {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }
}

export const storeService = new StoreService()
