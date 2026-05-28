import client from './client'
import type { Panel } from '../types'

export const panelsApi = {
  list: () => client.get<Panel[]>('/panels').then(r => r.data),
  get: (id: string) => client.get<Panel>(`/panels/${id}`).then(r => r.data),
  create: (data: Omit<Panel, '_id'>) => client.post<Panel>('/panels', data).then(r => r.data),
  update: (id: string, data: Partial<Panel>) => client.put<Panel>(`/panels/${id}`, data).then(r => r.data),
  delete: (id: string) => client.delete(`/panels/${id}`).then(r => r.data),
}
