import type { ReactNode } from 'react'
import { create } from 'zustand'

export interface OverlayConfig {
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  /** Content, or a render function receiving a close callback. */
  content: ReactNode | ((close: () => void) => ReactNode)
}

interface OverlayState {
  modal: OverlayConfig | null
  drawer: OverlayConfig | null
  openModal: (c: OverlayConfig) => void
  closeModal: () => void
  openDrawer: (c: OverlayConfig) => void
  closeDrawer: () => void
}

/** Global modal/drawer host state; rendered once by <OverlayHost />. */
export const useOverlayStore = create<OverlayState>((set) => ({
  modal: null,
  drawer: null,
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
  openDrawer: (drawer) => set({ drawer }),
  closeDrawer: () => set({ drawer: null }),
}))
