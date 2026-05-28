import { create } from 'zustand'
import type { AdminUser } from '../types'

interface AuthState {
  user: AdminUser | null
  isChecked: boolean
  setUser: (user: AdminUser | null) => void
  setChecked: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isChecked: false,
  setUser: (user) => set({ user }),
  setChecked: () => set({ isChecked: true }),
}))
