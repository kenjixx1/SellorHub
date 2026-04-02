import type { SellerProduct } from './seller'

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
