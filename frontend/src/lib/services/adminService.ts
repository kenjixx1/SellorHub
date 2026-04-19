import { apiClient } from '../api'

export type AdminStats = {
  users: { total: number; buyers: number; sellers: number; pending_seller_approvals: number }
  stores: { total: number }
  products: { total: number; active: number }
  inquiries: { total: number; today: number }
}

export type AdminUser = {
  id: number
  username: string
  email: string
  phone_number?: string | null
  role: 'buyer' | 'seller' | 'admin'
  selling_approve: boolean
  created_at: string
}

export type AdminProduct = {
  id: number
  title: string
  price: number
  status: 'active' | 'sold' | 'hidden'
  store_id: number
  created_at: string
  store?: {
    name: string
  }
}

export type GetUsersFilters = {
  role?: 'buyer' | 'seller' | 'admin'
  search?: string
  page?: number
  limit?: number
}

type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pages: number
  limit: number
}

export class AdminService {
  async getStats(token: string): Promise<AdminStats> {
    return apiClient.fetch<AdminStats>('/api/admin/stats', { token })
  }

  async getUsers(token: string, filters: GetUsersFilters = {}): Promise<AdminUser[]> {
    const params = new URLSearchParams()
    if (filters.role) params.set('role', filters.role)
    if (filters.search) params.set('search', filters.search)
    if (filters.page != null) params.set('page', String(filters.page))
    if (filters.limit != null) params.set('limit', String(filters.limit))
    const qs = params.toString()
    const res = await apiClient.fetch<PaginatedResponse<AdminUser>>(
      `/api/admin/users${qs ? `?${qs}` : ''}`,
      { token },
    )
    return res.items
  }

  async getPendingSellers(token: string): Promise<AdminUser[]> {
    const res = await apiClient.fetch<PaginatedResponse<AdminUser>>(
      '/api/admin/users/pending-sellers',
      { token },
    )
    return res.items
  }

  async approveSeller(token: string, userId: number, approve: boolean): Promise<AdminUser> {
    return apiClient.fetch<AdminUser>(`/api/admin/users/${userId}/approve-seller`, {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve }),
    })
  }

  async deleteUser(token: string, userId: number): Promise<void> {
    return apiClient.fetch<void>(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      token,
    })
  }

  async getProducts(token: string, status?: string, page: number = 1): Promise<AdminProduct[]> {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    params.set('page', String(page))
    params.set('limit', '50')
    const res = await apiClient.fetch<PaginatedResponse<AdminProduct>>(
      `/api/admin/products?${params.toString()}`,
      { token },
    )
    return res.items
  }

  async hideProduct(token: string, productId: number): Promise<void> {
    await apiClient.fetch(`/api/admin/products/${productId}/hide`, {
      method: 'PUT',
      token,
    })
  }

  async unhideProduct(token: string, productId: number): Promise<void> {
    await apiClient.fetch(`/api/admin/products/${productId}/unhide`, {
      method: 'PUT',
      token,
    })
  }
}

export const adminService = new AdminService()
