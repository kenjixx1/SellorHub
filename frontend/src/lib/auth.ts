import { apiFetch } from './api'

export type UserRole = 'buyer' | 'seller' | 'admin'

export type User = {
  id: number
  username: string
  email: string
  phone_number?: string | null
  role: UserRole
  selling_approve: boolean
  created_at: string
}

export type TokenResponse = {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  user: User
}

export async function login(email: string, password: string) {
  return await apiFetch<TokenResponse>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export async function register(username: string, email: string, password: string, role: string, phone_number: string) {
  return await apiFetch<User>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, role, phone_number }),
  })
}

export async function me(token: string) {
  return await apiFetch<User>('/api/auth/me', { token })
}

