import { apiFetch } from './api'
import type { OrderResponse } from './types'

export async function createOrderFromCart(
  token: string, 
  storeId: number, 
  addressId: number
): Promise<OrderResponse> {
  return apiFetch('/api/orders/checkout/cart', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      store_id: storeId,
      shipping_address_id: addressId
    })
  })
}

export async function createOrderDirect(
  token: string,
  storeId: number,
  items: { product_id: number, quantity: number }[],
  addressId: number
): Promise<OrderResponse> {
  return apiFetch('/api/orders/checkout', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      store_id: storeId,
      shipping_address_id: addressId,
      items: items
    })
  })
}

export async function listStoreOrders(
  token: string,
  status?: string,
  page: number = 1,
  limit: number = 20
): Promise<any> {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  params.set('page', String(page))
  params.set('limit', String(limit))
  const qs = params.toString()
  return apiFetch(`/api/orders/store/list${qs ? `?${qs}` : ''}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
}

export async function updateOrderStatus(
  token: string,
  orderId: number,
  status: string,
  note?: string
): Promise<OrderResponse> {
  return apiFetch(`/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status, note })
  })
}

export async function listMyOrders(token: string): Promise<any> {
  return apiFetch('/api/orders/mine', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
}
