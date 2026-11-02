import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  /** Demo mode: a website enquiry arrives roughly every 90 seconds. */
  simulateEnquiries: boolean
  soundOn: boolean
  /** A new lead not contacted within this many minutes is flagged red. */
  slaMinutes: number
  /** ...and past this many minutes it escalates to the owner. */
  escalationMinutes: number
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      simulateEnquiries: true,
      soundOn: true,
      slaMinutes: 15,
      escalationMinutes: 60,
      set: (patch) => set(patch),
    }),
    { name: 'anita-crm:settings' },
  ),
)
