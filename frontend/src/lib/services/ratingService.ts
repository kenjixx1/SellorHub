import { apiClient } from '../api'
import type { RatingResponse, StoreSummaryRating } from '../types'

export class RatingService {
  async getStoreRatings(storeId: number, page: number = 1, limit: number = 20): Promise<StoreSummaryRating> {
    return apiClient.fetch<StoreSummaryRating>(`/api/ratings/store/${storeId}?page=${page}&limit=${limit}`)
  }

  async create(
    token: string,
    data: { store_id: number; score: number; comment?: string; order_id?: number }
  ): Promise<RatingResponse> {
    return apiClient.fetch<RatingResponse>('/api/ratings', {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async update(
    token: string,
    ratingId: number,
    data: { score?: number; comment?: string }
  ): Promise<RatingResponse> {
    return apiClient.fetch<RatingResponse>(`/api/ratings/${ratingId}`, {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async delete(token: string, ratingId: number): Promise<void> {
    return apiClient.fetch<void>(`/api/ratings/${ratingId}`, {
      method: 'DELETE',
      token,
    })
  }
}

export const ratingService = new RatingService()
