import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CampusState {
  selectedCampusId: string | null
  setSelectedCampusId: (id: string | null) => void
}

export const useCampusStore = create<CampusState>()(
  persist(
    (set) => ({
      selectedCampusId: null,
      setSelectedCampusId: (id) => set({ selectedCampusId: id }),
    }),
    {
      name: 'campus-storage',
    }
  )
)
