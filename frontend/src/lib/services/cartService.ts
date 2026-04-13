import { apiClient } from '../api'
import type { CartResponse } from '../types'

export class CartService {
  async getCart(token: string): Promise<CartResponse> {
    return apiClient.fetch<CartResponse>('/api/cart', { token })
  }

  async addToCart(token: string, productId: number, quantity: number = 1): Promise<CartResponse> {
    return apiClient.fetch<CartResponse>('/api/cart/items', {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity }),
    })
  }

  async updateItem(token: string, itemId: number, quantity: number): Promise<CartResponse> {
    return apiClient.fetch<CartResponse>(`/api/cart/items/${itemId}`, {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })
  }

  async removeItem(token: string, itemId: number): Promise<CartResponse> {
    return apiClient.fetch<CartResponse>(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
      token,
    })
  }

  async clear(token: string): Promise<CartResponse> {
    return apiClient.fetch<CartResponse>('/api/cart', {
      method: 'DELETE',
      token,
    })
  }
}

export const cartService = new CartService()
