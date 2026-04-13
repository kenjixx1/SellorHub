import { apiClient } from '../api'
import type { User } from '../types'

export type UpdateProfilePayload = {
  username?: string
  email?: string
  phone_number?: string | null
}

export class UserService {
  async updateProfile(token: string, data: UpdateProfilePayload): Promise<User> {
    return apiClient.fetch<User>('/api/users/me', {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }

  async uploadAvatar(token: string, file: File): Promise<User> {
    const form = new FormData()
    form.append('file', file)
    return apiClient.upload<User>('/api/users/me/avatar', form, token)
  }
}

export const userService = new UserService()
