export interface Address {
  id: number
  label: string
  recipient_name: string
  phone: string
  address_line1: string
  address_line2?: string | null
  city: string
  province: string
  postal_code: string
  country: string
  is_default: boolean
}

export interface CartProductSnapshot {
  id: number
  title: string
  price: number
  stock: number | null
  status: string
  store_id: number
  image_url: string | null
}

export interface CartItem {
  id: number
  product_id: number
  quantity: number
  product: CartProductSnapshot
  created_at: string
  updated_at: string
}

export interface CartResponse {
  items: CartItem[]
  total_items: number
  total_amount: number
}
