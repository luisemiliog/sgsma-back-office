import client from './client'
import type { ContentMeta } from '../types'

export const contentApi = {
  meta: () => client.get<ContentMeta>('/content/meta').then(r => r.data),
  republish: () => client.post<{ ok: boolean; hash: string; updatedAt: string }>('/content/republish').then(r => r.data),
}
