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

/**
 * Register a new account. Matches backend `UserCreate`:
 * - `phone_number` is optional — omit entirely when blank (empty string breaks DB UNIQUE).
 */
export async function register(
  username: string,
  email: string,
  password: string,
  role: UserRole,
  phone_number: string,
) {
  const payload: Record<string, string | UserRole> = {
    username,
    email,
    password,
    role,
  }
  const phone = phone_number?.trim()
  if (phone) {
    payload.phone_number = phone
  }

  return await apiFetch<User>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function me(token: string) {
  return await apiFetch<User>('/api/auth/me', { token })
}

