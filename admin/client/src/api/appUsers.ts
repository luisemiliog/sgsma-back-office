import client from './client'
import type { AppUser } from '../types'

export const appUsersApi = {
  list: () => client.get<AppUser[]>('/app-users').then(r => r.data),
  sendReset: (id: string) =>
    client.post<{ message: string }>(`/app-users/${id}/send-reset`).then(r => r.data),
  setQr: (id: string, qrUrl: string | null) =>
    client.put<{ ok: boolean; qrUrl: string | null }>(`/app-users/${id}/qr`, { qrUrl }).then(r => r.data),
  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return client.post<{ url: string }>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}
