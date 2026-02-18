import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimePeriod, DateKey, Theme } from '@/types';
import { today } from '@/lib/dateUtils';

interface UIState {
  selectedPeriod: TimePeriod;
  setSelectedPeriod: (period: TimePeriod) => void;
  checkinDate: DateKey;
  setCheckinDate: (date: DateKey) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedPeriod: '30d',
      setSelectedPeriod: (period) => set({ selectedPeriod: period }),
      checkinDate: today(),
      setCheckinDate: (date) => set({ checkinDate: date }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'lifeflow-ui-settings',
      partialize: (state) => ({
        selectedPeriod: state.selectedPeriod,
        theme: state.theme,
      }),
    }
  )
);
