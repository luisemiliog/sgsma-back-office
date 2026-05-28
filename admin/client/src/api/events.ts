import client from './client'
import type { Event } from '../types'

export const eventsApi = {
  list: () => client.get<Event[]>('/events').then(r => r.data),
  listFull: () => client.get<Event[]>('/events/full').then(r => r.data),
  get: (id: string) => client.get<Event>(`/events/${id}`).then(r => r.data),
  create: (data: Omit<Event, '_id' | 'speakers' | 'papers'>) => client.post<Event>('/events', data).then(r => r.data),
  update: (id: string, data: Partial<Omit<Event, 'speakers' | 'papers'>>) => client.put<Event>(`/events/${id}`, data).then(r => r.data),
  delete: (id: string) => client.delete(`/events/${id}`).then(r => r.data),
}
