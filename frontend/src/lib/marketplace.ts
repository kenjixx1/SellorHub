import { apiFetch } from './api'
import type { SellerProduct } from './seller'

export type PublicProduct = SellerProduct & {
  store_name?: string
  store_slug?: string
}

export type PublicProductResponse = {
  items: PublicProduct[]
  total: number
  page: number
  pages: number
  limit: number
}

export type GetPublicProductsFilters = {
  search?: string
  min_price?: number
  max_price?: number
  group_ids?: number[]
  store_ids?: number[]
  sort_by?: string
  page?: number
  limit?: number
}

export async function getPublicProducts(
  filters: GetPublicProductsFilters = {},
): Promise<PublicProductResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.min_price != null) params.set('min_price', String(filters.min_price))
  if (filters.max_price != null) params.set('max_price', String(filters.max_price))
  
  if (filters.group_ids) {
    filters.group_ids.forEach(id => params.append('group_ids', String(id)))
  }
  if (filters.store_ids) {
    filters.store_ids.forEach(id => params.append('store_ids', String(id)))
  }
  
  if (filters.sort_by) params.set('sort_by', filters.sort_by)
  if (filters.page != null) params.set('page', String(filters.page))
  if (filters.limit != null) params.set('limit', String(filters.limit))
  
  const qs = params.toString()
  return apiFetch<PublicProductResponse>(`/api/products${qs ? `?${qs}` : ''}`)
}

export async function getProduct(productId: number): Promise<PublicProduct> {
  return apiFetch<PublicProduct>(`/api/products/${productId}`)
}
