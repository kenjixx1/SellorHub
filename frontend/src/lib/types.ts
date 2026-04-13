export interface User {
  id: number
  username: string
  email: string
  role: 'buyer' | 'seller' | 'admin'
  full_name?: string | null
  phone_number?: string | null
  avatar_url?: string | null
  selling_approve: boolean
  created_at: string
}

// ── Shared DTOs for Products and Stores ────────────────────────────────────────

export type ProductStatus = 'active' | 'sold' | 'hidden'

export interface ProductImage {
  id: number
  image_url: string
  position: number
}

export interface SellerProduct {
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

export type PublicProduct = SellerProduct & {
  store_name?: string
  store_slug?: string
}

export interface ProductGroup {
  id: number
  store_id: number
  name: string
  created_at: string
  product_count: number
}

export interface StoreProfile {
  id: number
  owner_id: number
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
  product_count?: number
  created_at: string
}

// ── Inquiries ──────────────────────────────────────────────────────────────────

export type InquiryStatus = 'new' | 'replied' | 'closed'

export interface InquiryProductInfo {
  id: number
  title: string
}

export interface Inquiry {
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

export interface InquiryStats {
  new: number
  replied: number
  closed: number
  total: number
}

// ── Cart and Orders ─────────────────────────────────────────────────────────────

export interface CartItem {
  id: number
  user_id: number
  product_id: number
  quantity: number
  created_at: string
  product: SellerProduct & { image_url?: string | null }
}

export interface CartResponse {
  items: CartItem[]
  total_items: number
  total_price: number
}

export interface OrderItemResponse {
  id: number
  product_id: number
  product_title_snapshot: string
  unit_price_snapshot: number
  quantity: number
}

export interface AddressResponse {
  id: number
  label?: string
  recipient_name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  province: string
  postal_code: string
  country: string
  is_default: boolean
  user_id: number
  created_at: string
}

export interface OrderResponse {
  id: number
  order_number: string
  buyer_id: number
  store_id: number
  status: string
  total_amount: number
  currency: string
  shipping_address_id: number
  shipping_address?: AddressResponse
  created_at: string
  updated_at: string
  items: OrderItemResponse[]
}

export interface DirectCheckoutItem {
  product_id: number
  quantity: number
  product: {
    id: number
    title: string
    price: string | number
    stock?: number | null
    status: string
    store_id: number
    image_url: string | null
  }
}

// ── Ratings ────────────────────────────────────────────────────────────────────

export interface RatingBuyerInfo {
  id: number
  username: string
  avatar_url?: string | null
}

export interface RatingResponse {
  id: number
  store_id: number
  buyer_id: number
  order_id?: number | null
  score: number
  comment?: string | null
  created_at: string
  updated_at: string
  buyer?: RatingBuyerInfo
}

export interface StoreSummaryRating {
  store_id: number
  average_score?: number | null
  total_ratings: number
  ratings: RatingResponse[]
}

// ── Response Formats and Filters (Optional here vs in services) ────────────────

export interface ProductListResponse {
  products: SellerProduct[]
  total: number
  page: number
  pages: number
}

export interface SellerDashboard {
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

export interface PublicProductResponse {
  items: PublicProduct[]
  total: number
  page: number
  pages: number
  limit: number
}

export interface StoreProductsResponse {
  products: SellerProduct[] // public store product is just sellerproduct
  total: number
  page: number
  pages: number
}

export interface StoreListResponse {
  items: StoreProfile[]
  total: number
  page: number
  pages: number
  limit: number
}

export interface StoreListFilters {
  search?: string
  page?: number
  limit?: number
}

export interface StoreProductsFilters {
  group_id?: number
  min_price?: number
  max_price?: number
  sort_by?: string
  page?: number
  limit?: number
}
export interface GetPublicProductsFilters {
  search?: string
  min_price?: number
  max_price?: number
  group_ids?: number[]
  store_ids?: number[]
  sort_by?: string
  page?: number
  limit?: number
}
