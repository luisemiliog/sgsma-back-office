import client from './client'

export interface EventRatingSummary {
  eventId: string
  title: string
  type?: string
  day?: number
  average: number | null
  total: number
  breakdown: Record<string, number>
}

export interface RatingEntry {
  _id: string
  stars: number
  comment?: string | null
  createdAt?: string
  userName: string
}

export const ratingsApi = {
  list: () => client.get<EventRatingSummary[]>('/ratings').then(r => r.data),
  byEvent: (eventId: string) => client.get<RatingEntry[]>(`/ratings/${eventId}`).then(r => r.data),
}
