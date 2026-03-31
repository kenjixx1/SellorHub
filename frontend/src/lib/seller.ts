import { apiFetch } from './api'

// ── Inquiry types ─────────────────────────────────────────────────────────────

export type InquiryStatus = 'new' | 'replied' | 'closed'

export type InquiryProductInfo = {
  id: number
  title: string
}

export type Inquiry = {
  id: number
  store_id: number
  product_id: number
  buyer_name: string
  buyer_email: string
  message: string
  status: InquiryStatus
  created_at: string
  product?: InquiryProductInfo | null
}

export type InquiryStats = {
  new: number
  replied: number
  closed: number
  total: number
}

// ── Product types ─────────────────────────────────────────────────────────────

export type ProductStatus = 'active' | 'sold' | 'hidden'

export type ProductImage = {
  id: number
  image_url: string
  position: number
}

export type SellerProduct = {
  id: number
  store_id: number
  title: string
  description?: string | null
  price: string
  stock?: number | null
  status: ProductStatus
  group_id?: number | null
  created_at: string
  updated_at: string
  images: ProductImage[]
}

export type ProductListResponse = {
  products: SellerProduct[]
  total: number
  page: number
  pages: number
}

// ── Product group types ────────────────────────────────────────────────────────

export type ProductGroup = {
  id: number
  store_id: number
  name: string
  created_at: string
  product_count: number
}

// ── Dashboard type ────────────────────────────────────────────────────────────

export type SellerDashboard = {
  store: {
    id: number
    name: string
    slug: string
  }
  stats: {
    total_products: number
    active_products: number
    inquiries: InquiryStats
  }
  recent_inquiries: Inquiry[]
}

// ── API helpers ───────────────────────────────────────────────────────────────

export async function getSellerDashboard(token: string): Promise<SellerDashboard> {
  return apiFetch<SellerDashboard>('/api/stores/me/dashboard', { token })
}

export type GetSellerProductsFilters = {
  group_id?: number
  status?: ProductStatus
  page?: number
  limit?: number
}

export async function getSellerProducts(
  token: string,
  filters: GetSellerProductsFilters = {},
): Promise<ProductListResponse> {
  const params = new URLSearchParams()
  if (filters.group_id != null) params.set('group_id', String(filters.group_id))
  if (filters.status) params.set('status', filters.status)
  if (filters.page != null) params.set('page', String(filters.page))
  if (filters.limit != null) params.set('limit', String(filters.limit))
  const qs = params.toString()
  return apiFetch<ProductListResponse>(`/api/products/seller/list${qs ? `?${qs}` : ''}`, { token })
}

export async function getMyProductGroups(token: string): Promise<ProductGroup[]> {
  return apiFetch<ProductGroup[]>('/api/product-groups/my-store', { token })
}
