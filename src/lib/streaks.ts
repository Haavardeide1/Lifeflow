import type { DateKey, DailyEntry, StreakInfo } from '@/types';
import { today, addDays } from './dateUtils';

export function calculateStreak(
  habitId: string,
  habitName: string,
  entries: Record<DateKey, DailyEntry>
): StreakInfo {
  const sortedDates = Object.keys(entries).sort();
  if (sortedDates.length === 0) {
    return { habitId, habitName, currentStreak: 0, longestStreak: 0, lastActiveDate: '' };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastActiveDate = '';

  // Walk forward through dates to find streaks
  for (const date of sortedDates) {
    const entry = entries[date];
    const hc = entry.habitCompletions.find(c => c.habitId === habitId);
    const completed = hc?.completed ?? false;

    if (completed) {
      tempStreak++;
      lastActiveDate = date;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Current streak: only counts if last active was today or yesterday
  const todayStr = today();
  const yesterdayStr = addDays(todayStr, -1);
  if (lastActiveDate === todayStr || lastActiveDate === yesterdayStr) {
    currentStreak = tempStreak;
  }

  return { habitId, habitName, currentStreak, longestStreak, lastActiveDate };
}

export function calculateAllStreaks(
  habits: Record<string, import('@/types').Habit>,
  entries: Record<DateKey, DailyEntry>
): StreakInfo[] {
  return Object.values(habits)
    .filter(h => h.active && h.type === 'good')
    .map(h => calculateStreak(h.id, h.name, entries));
}
