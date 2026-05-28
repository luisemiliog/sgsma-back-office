import client from './client'
import type { Speaker } from '../types'

export const speakersApi = {
  list: () => client.get<Speaker[]>('/speakers').then(r => r.data),
  get: (id: string) => client.get<Speaker>(`/speakers/${id}`).then(r => r.data),
  create: (data: Omit<Speaker, '_id'>) => client.post<Speaker>('/speakers', data).then(r => r.data),
  update: (id: string, data: Partial<Speaker>) => client.put<Speaker>(`/speakers/${id}`, data).then(r => r.data),
  delete: (id: string) => client.delete(`/speakers/${id}`).then(r => r.data),
}
