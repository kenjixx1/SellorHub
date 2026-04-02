import { apiFetch } from './api'
import type { CartResponse } from './types'

export async function getCart(token: string): Promise<CartResponse> {
  return apiFetch<CartResponse>('/api/cart', { token })
}

export async function addToCart(token: string, productId: number, quantity: number = 1): Promise<CartResponse> {
  return apiFetch<CartResponse>('/api/cart/items', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, quantity }),
  })
}

export async function updateCartItem(token: string, itemId: number, quantity: number): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/api/cart/items/${itemId}`, {
    method: 'PUT',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  })
}

export async function removeCartItem(token: string, itemId: number): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/api/cart/items/${itemId}`, {
    method: 'DELETE',
    token,
  })
}

export async function clearCart(token: string): Promise<CartResponse> {
  return apiFetch<CartResponse>('/api/cart', {
    method: 'DELETE',
    token,
  })
}
