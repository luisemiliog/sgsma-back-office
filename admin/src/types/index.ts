import type { ObjectId } from 'mongodb'

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer'

export interface AdminUserDoc {
  _id?: ObjectId | string
  username: string
  passwordHash: string
  role: UserRole
  displayName?: string
  email?: string
  createdAt?: string
  updatedAt?: string
}

export type EventType =
  | 'keynote'
  | 'panel'
  | 'paper_session'
  | 'tutorial'
  | 'townhall'
  | 'workshop'
  | 'ceremony'
  | 'break'
  | 'registration'
  | 'sponsor'
  | 'social'

export interface Event {
  _id?: ObjectId | string
  type: EventType
  day: number
  date?: string
  startTime: string
  endTime: string
  title: string
  location?: string | null
  track?: number | null
  description?: string | null
  speakerIds?: string[]
  paperIds?: string[]
  panelId?: string | null
  createdAt?: string
  updatedAt?: string
}

export type SpeakerRole = 'keynote' | 'panelist' | 'instructor' | 'committee'

export interface Speaker {
  _id?: ObjectId | string
  slug?: string
  name: string
  affiliation?: string
  country?: string
  role: SpeakerRole
  bio?: string
  photoUrl?: string
  email?: string
  jobTitle?: string
  createdAt?: string
  updatedAt?: string
}

export interface Paper {
  _id?: ObjectId | string
  paperId?: string
  title: string
  authors: string[]
  institution?: string
  sessionId?: string
  abstract?: string | null
  keywords?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface PanelParticipant {
  speakerId: string
  name: string
  talkTitle?: string | null
  abstract?: string | null
}

export interface Panel {
  _id?: ObjectId | string
  title: string
  description?: string
  day: number
  date?: string
  startTime: string
  endTime: string
  track?: number | null
  chair: PanelParticipant
  panelists: PanelParticipant[]
  createdAt?: string
  updatedAt?: string
}

export interface Announcement {
  _id?: ObjectId | string
  title: string
  body: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  imageUrl?: string
  createdAt?: string
}

export interface ContentMeta {
  _id?: ObjectId | string
  hash: string
  updatedAt: string
}

export interface JwtPayload {
  sub: string
  username: string
  role: UserRole
  jti: string
  iat?: number
  exp?: number
}
