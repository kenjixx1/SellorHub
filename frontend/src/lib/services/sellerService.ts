import { apiClient } from '../api'
import type { SellerDashboard, ProductGroup } from '../types'

export class SellerService {
  async getDashboard(token: string): Promise<SellerDashboard> {
    return apiClient.fetch<SellerDashboard>('/api/stores/me/dashboard', { token })
  }

  async getMyProductGroups(token: string): Promise<ProductGroup[]> {
    return apiClient.fetch<ProductGroup[]>('/api/product-groups/my-store', { token })
  }
}

export const sellerService = new SellerService()
