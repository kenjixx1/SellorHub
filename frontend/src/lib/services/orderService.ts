import { apiClient } from '../api'
import type { OrderResponse } from '../types'

export class OrderService {
  async createFromCart(token: string, storeId: number, addressId: number): Promise<OrderResponse> {
    return apiClient.fetch<OrderResponse>('/api/orders/checkout/cart', {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_id: storeId, shipping_address_id: addressId })
    })
  }

  async createDirect(
    token: string,
    storeId: number,
    items: { product_id: number, quantity: number }[],
    addressId: number
  ): Promise<OrderResponse> {
    return apiClient.fetch<OrderResponse>('/api/orders/checkout', {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_id: storeId, shipping_address_id: addressId, items })
    })
  }

  async listStoreOrders(token: string, status?: string, page: number = 1, limit: number = 20): Promise<any> {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    params.set('page', String(page))
    params.set('limit', String(limit))
    const qs = params.toString()
    return apiClient.fetch(`/api/orders/store/list${qs ? `?${qs}` : ''}`, { token })
  }

  async updateStatus(token: string, orderId: number, status: string, note?: string): Promise<OrderResponse> {
    return apiClient.fetch<OrderResponse>(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note })
    })
  }

  async listMyOrders(token: string): Promise<any> {
    return apiClient.fetch('/api/orders/mine', { token })
  }
}

export const orderService = new OrderService()
