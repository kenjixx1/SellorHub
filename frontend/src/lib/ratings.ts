import { apiFetch } from './api'
import type { RatingResponse, StoreSummaryRating } from './types'

export async function getStoreRatings(
  storeId: number, 
  page: number = 1, 
  limit: number = 20
): Promise<StoreSummaryRating> {
  return apiFetch(`/api/ratings/store/${storeId}?page=${page}&limit=${limit}`)
}

export async function createRating(
  token: string,
  data: { store_id: number; score: number; comment?: string; order_id?: number }
): Promise<RatingResponse> {
  return apiFetch('/api/ratings', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function updateRating(
  token: string,
  ratingId: number,
  data: { score?: number; comment?: string }
): Promise<RatingResponse> {
  return apiFetch(`/api/ratings/${ratingId}`, {
    method: 'PUT',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteRating(token: string, ratingId: number): Promise<void> {
  return apiFetch(`/api/ratings/${ratingId}`, {
    method: 'DELETE',
    token,
  })
}
