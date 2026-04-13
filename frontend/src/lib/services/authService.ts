import { apiClient } from '../api'
import type { User } from '../types'

export type TokenResponse = {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  user: User
}

export class AuthService {
  async login(email: string, password: string): Promise<TokenResponse> {
    return apiClient.fetch<TokenResponse>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  }

  async register(
    username: string,
    email: string,
    password: string,
    role: string,
    phone_number: string
  ): Promise<User> {
    const payload: Record<string, string> = { username, email, password, role }
    const phone = phone_number?.trim()
    if (phone) {
      payload.phone_number = phone
    }
    return apiClient.fetch<User>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  async me(token: string): Promise<User> {
    return apiClient.fetch<User>('/api/auth/me', { token })
  }
}

export const authService = new AuthService()
