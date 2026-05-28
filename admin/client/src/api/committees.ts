import client from './client'

export interface CommitteeMember {
  _id?: string
  group: string
  name: string
  role: string
  affiliation: string
  country: string
  order?: number
}

export interface CommitteeGroup {
  group: string
  label: string
  members: CommitteeMember[]
}

export const committeesApi = {
  list:   () => client.get<CommitteeGroup[]>('/committees').then(r => r.data),
  create: (data: Omit<CommitteeMember, '_id'>) =>
    client.post<CommitteeMember>('/committees', data).then(r => r.data),
  update: (id: string, data: Partial<CommitteeMember>) =>
    client.put(`/committees/${id}`, data).then(r => r.data),
  delete: (id: string) => client.delete(`/committees/${id}`).then(r => r.data),
}
