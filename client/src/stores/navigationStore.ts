import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NavigationState {
  activeSection: string
  setActiveSection: (section: string) => void
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      activeSection: 'overview',
      setActiveSection: (section) => set({ activeSection: section }),
    }),
    {
      name: 'navigation-storage',
    }
  )
)
