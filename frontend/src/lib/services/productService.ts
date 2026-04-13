import { apiClient } from '../api'
import type { PublicProduct, PublicProductResponse, GetPublicProductsFilters, SellerProduct, ProductImage, ProductStatus, ProductListResponse } from '../types'

export type CreateProductPayload = {
  title: string
  description?: string
  price: number
  stock?: number | null
  status: ProductStatus
  group_id?: number | null
}

export type UpdateProductPayload = {
  title?: string
  description?: string | null
  price?: number
  stock?: number | null
  status?: ProductStatus
  group_id?: number | null
}

export type GetSellerProductsFilters = {
  group_id?: number
  status?: ProductStatus
  page?: number
  limit?: number
}

export class ProductService {
  // Public Methods
  async getPublicProducts(filters: GetPublicProductsFilters = {}): Promise<PublicProductResponse> {
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
    return apiClient.fetch<PublicProductResponse>(`/api/products${qs ? `?${qs}` : ''}`)
  }

  async getById(productId: number): Promise<PublicProduct> {
    return apiClient.fetch<PublicProduct>(`/api/products/${productId}`)
  }

  // Seller Methods
  async getSellerProducts(token: string, filters: GetSellerProductsFilters = {}): Promise<ProductListResponse> {
    const params = new URLSearchParams()
    if (filters.group_id != null) params.set('group_id', String(filters.group_id))
    if (filters.status) params.set('status', filters.status)
    if (filters.page != null) params.set('page', String(filters.page))
    if (filters.limit != null) params.set('limit', String(filters.limit))
    const qs = params.toString()
    return apiClient.fetch<ProductListResponse>(`/api/products/seller/list${qs ? `?${qs}` : ''}`, { token })
  }

  async create(token: string, data: CreateProductPayload): Promise<SellerProduct> {
    return apiClient.fetch<SellerProduct>('/api/products', {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async update(token: string, productId: number, data: UpdateProductPayload): Promise<SellerProduct> {
    return apiClient.fetch<SellerProduct>(`/api/products/${productId}`, {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async delete(token: string, productId: number): Promise<void> {
    return apiClient.fetch<void>(`/api/products/${productId}`, {
      method: 'DELETE',
      token,
    })
  }

  async uploadImage(token: string, productId: number, file: File, position: number = 0): Promise<ProductImage> {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.upload<ProductImage>(`/api/products/${productId}/images?position=${position}`, formData, token)
  }
}

export const productService = new ProductService()
