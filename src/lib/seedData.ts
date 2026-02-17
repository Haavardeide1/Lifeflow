import type { HabitType } from '@/types';

export const DEFAULT_HABITS: {
  name: string;
  type: HabitType;
  weight: number;
  icon: string;
  color: string;
}[] = [
  { name: 'Went for a run',            type: 'good', weight: 7, icon: 'footprints',  color: '#22c55e' },
  { name: 'Strength training',         type: 'good', weight: 7, icon: 'dumbbell',    color: '#3b82f6' },
  { name: 'Called a friend',            type: 'good', weight: 8, icon: 'phone',       color: '#a855f7' },
  { name: 'Read for 30 min',           type: 'good', weight: 5, icon: 'book-open',   color: '#06b6d4' },
  { name: 'Meditated',                 type: 'good', weight: 6, icon: 'brain',       color: '#14b8a6' },
  { name: 'Screen time 1h before bed', type: 'bad',  weight: 5, icon: 'monitor',     color: '#f97316' },
  { name: 'Watched porn',              type: 'bad',  weight: 9, icon: 'eye-off',     color: '#ef4444' },
  { name: 'Drank alcohol',             type: 'bad',  weight: 6, icon: 'beer',        color: '#eab308' },
];
