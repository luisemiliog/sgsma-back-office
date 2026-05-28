import client from './client'
import type { AdminUser, UserRole } from '../types'

export interface CreateUserPayload {
  username: string
  password: string
  role: UserRole
  displayName?: string
  email?: string
}

export interface UpdateUserPayload {
  role?: UserRole
  displayName?: string
  email?: string
  password?: string
}

export const usersApi = {
  list: () => client.get<AdminUser[]>('/users').then(r => r.data),
  create: (data: CreateUserPayload) => client.post<AdminUser>('/users', data).then(r => r.data),
  update: (id: string, data: UpdateUserPayload) => client.put<AdminUser>(`/users/${id}`, data).then(r => r.data),
  delete: (id: string) => client.delete(`/users/${id}`).then(r => r.data),
}
