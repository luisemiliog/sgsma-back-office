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

export interface Speaker {
  _id?: string
  slug?: string
  name: string
  affiliation?: string
  country?: string
  role: 'keynote' | 'panelist' | 'instructor' | 'committee'
  bio?: string
  photoUrl?: string
  email?: string
  jobTitle?: string
  createdAt?: string
  updatedAt?: string
}

export interface Paper {
  _id?: string
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

export interface Event {
  _id?: string
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
  speakers?: Speaker[]
  papers?: Paper[]
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
  _id?: string
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
  _id?: string
  title: string
  body: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  imageUrl?: string
  createdAt?: string
}

export interface ContentMeta {
  hash: string | null
  updatedAt: string | null
}

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer'

export interface AdminUser {
  _id?: string
  username: string
  displayName?: string
  email?: string
  role: UserRole
  createdAt?: string
  updatedAt?: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
}

export const ROLE_COLORS: Record<UserRole, 'cyan' | 'orange' | 'yellow' | 'slate'> = {
  super_admin: 'orange',
  admin: 'cyan',
  editor: 'yellow',
  viewer: 'slate',
}

export interface AppUser {
  _id?: string
  email: string
  googleSub?: string | null
  active?: boolean
  createdAt?: string
  name?: string | null
  qrUrl?: string | null
}
