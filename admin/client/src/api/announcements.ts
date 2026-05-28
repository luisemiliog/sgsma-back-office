import client from './client'
import type { Announcement } from '../types'

export const announcementsApi = {
  list: () => client.get<Announcement[]>('/announcements').then(r => r.data),
  create: (data: Omit<Announcement, '_id' | 'createdAt'>) =>
    client.post<Announcement>('/announcements', data).then(r => r.data),
  delete: (id: string) => client.delete(`/announcements/${id}`).then(r => r.data),
  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return client.post<{ url: string }>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}
