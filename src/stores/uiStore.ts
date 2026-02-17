import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimePeriod, DateKey } from '@/types';
import { today } from '@/lib/dateUtils';

interface UIState {
  selectedPeriod: TimePeriod;
  setSelectedPeriod: (period: TimePeriod) => void;
  checkinDate: DateKey;
  setCheckinDate: (date: DateKey) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedPeriod: '30d',
      setSelectedPeriod: (period) => set({ selectedPeriod: period }),
      checkinDate: today(),
      setCheckinDate: (date) => set({ checkinDate: date }),
    }),
    {
      name: 'lifeflow-ui-settings',
      partialize: (state) => ({
        selectedPeriod: state.selectedPeriod,
      }),
    }
  )
);
