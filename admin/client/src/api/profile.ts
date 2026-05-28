import client from './client'
import type { AdminUser } from '../types'

export interface UpdateProfilePayload {
  displayName?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}

export const profileApi = {
  update: (data: UpdateProfilePayload) =>
    client.put<{ ok: boolean; user: AdminUser }>('/profile', data).then(r => r.data),
}
