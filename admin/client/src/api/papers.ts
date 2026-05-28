import client from './client'
import type { Paper } from '../types'

export const papersApi = {
  list: () => client.get<Paper[]>('/papers').then(r => r.data),
  get: (id: string) => client.get<Paper>(`/papers/${id}`).then(r => r.data),
  create: (data: Omit<Paper, '_id'>) => client.post<Paper>('/papers', data).then(r => r.data),
  update: (id: string, data: Partial<Paper>) => client.put<Paper>(`/papers/${id}`, data).then(r => r.data),
  delete: (id: string) => client.delete(`/papers/${id}`).then(r => r.data),
}
