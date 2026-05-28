import client from './client'
import type { AdminUser } from '../types'

export const authApi = {
  login: (username: string, password: string) =>
    client.post<{ ok: boolean; user: AdminUser }>('/auth/login', { username, password }).then(r => r.data),
  logout: () =>
    client.post<{ ok: boolean }>('/auth/logout').then(r => r.data),
  me: () =>
    client.get<{ user: AdminUser }>('/auth/me').then(r => r.data.user),
}
