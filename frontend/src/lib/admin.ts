import { apiFetch } from './api'

// ── Stats ───────────────────────────────────────────────────────────────────

export type AdminStats = {
  users: {
    total: number
    buyers: number
    sellers: number
    pending_seller_approvals: number
  }
  stores: {
    total: number
  }
  products: {
    total: number
    active: number
  }
  inquiries: {
    total: number
    today: number
  }
}

export async function getAdminStats(token: string): Promise<AdminStats> {
  return apiFetch<AdminStats>('/api/admin/stats', { token })
}

// ── Users ───────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: number
  username: string
  email: string
  phone_number?: string | null
  role: 'buyer' | 'seller' | 'admin'
  selling_approve: boolean
  created_at: string
}

export type GetUsersFilters = {
  role?: 'buyer' | 'seller' | 'admin'
  search?: string
  page?: number
  limit?: number
}

// Paginated wrapper returned by the backend Pagination.get_response()
type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pages: number
  limit: number
}

export async function getAdminUsers(
  token: string,
  filters: GetUsersFilters = {},
): Promise<AdminUser[]> {
  const params = new URLSearchParams()
  if (filters.role) params.set('role', filters.role)
  if (filters.search) params.set('search', filters.search)
  if (filters.page != null) params.set('page', String(filters.page))
  if (filters.limit != null) params.set('limit', String(filters.limit))
  const qs = params.toString()
  const res = await apiFetch<PaginatedResponse<AdminUser>>(
    `/api/admin/users${qs ? `?${qs}` : ''}`,
    { token },
  )
  return res.items
}

export async function getPendingSellers(token: string): Promise<AdminUser[]> {
  const res = await apiFetch<PaginatedResponse<AdminUser>>(
    '/api/admin/users/pending-sellers',
    { token },
  )
  return res.items
}

export async function approveSeller(
  token: string,
  userId: number,
  approve: boolean,
): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/users/${userId}/approve-seller`, {
    method: 'PUT',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approve }),
  })
}
