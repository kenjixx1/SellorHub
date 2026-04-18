import { apiClient } from '../api'
import type { SellerDashboard, ProductGroup } from '../types'

export class SellerService {
  async getDashboard(token: string): Promise<SellerDashboard> {
    return apiClient.fetch<SellerDashboard>('/api/stores/me/dashboard', { token })
  }

  async getMyProductGroups(token: string): Promise<ProductGroup[]> {
    return apiClient.fetch<ProductGroup[]>('/api/product-groups/my-store', { token })
  }

  async createProductGroup(token: string, name: string): Promise<ProductGroup> {
    return apiClient.fetch<ProductGroup>('/api/product-groups', {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  async updateProductGroup(token: string, groupId: number, name: string): Promise<ProductGroup> {
    return apiClient.fetch<ProductGroup>(`/api/product-groups/${groupId}`, {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  async deleteProductGroup(token: string, groupId: number): Promise<void> {
    return apiClient.fetch<void>(`/api/product-groups/${groupId}`, {
      method: 'DELETE',
      token,
    })
  }
}

export const sellerService = new SellerService()
