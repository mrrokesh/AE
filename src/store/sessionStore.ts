import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState {
  /** Demo login: no real auth, just the chosen user id. */
  currentUserId: string | null
  signIn: (userId: string) => void
  signOut: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentUserId: null,
      signIn: (currentUserId) => set({ currentUserId }),
      signOut: () => set({ currentUserId: null }),
    }),
    { name: 'anita-crm:session' },
  ),
)
