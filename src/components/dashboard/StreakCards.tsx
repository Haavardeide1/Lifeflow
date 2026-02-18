'use client';

import { useMemo } from 'react';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import { calculateAllStreaks } from '@/lib/streaks';
import { Card } from '@/components/shared/Card';
import { HabitIcon } from '@/components/shared/HabitIcon';
import { Flame } from 'lucide-react';

export function StreakCards() {
  const habits = useLifeflowStore((s) => s.habits);
  const entries = useLifeflowStore((s) => s.entries);

  const streaks = useMemo(
    () => calculateAllStreaks(habits, entries),
    [habits, entries]
  );

  const activeStreaks = streaks.filter(s => s.currentStreak > 0 || s.longestStreak > 0);

  if (activeStreaks.length === 0) return null;

  return (
    <Card title="Streaks">
      <div className="px-3 py-3 flex gap-2 overflow-x-auto">
        {activeStreaks.map(streak => {
          const habit = habits[streak.habitId];
          if (!habit) return null;

          return (
            <div
              key={streak.habitId}
              className="flex-shrink-0 w-32 rounded-xl bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <HabitIcon icon={habit.icon} size={14} className="text-gray-500 dark:text-white/50" />
                <span className="text-[11px] text-gray-500 dark:text-white/50 truncate">{habit.name}</span>
              </div>

              <div className="flex items-baseline gap-1">
                {streak.currentStreak > 0 && (
                  <Flame size={14} className="text-orange-400" />
                )}
                <span className="text-[22px] font-bold text-gray-900 dark:text-white">
                  {streak.currentStreak}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-white/30">days</span>
              </div>

              {streak.longestStreak > streak.currentStreak && (
                <p className="text-[10px] text-gray-400 dark:text-white/25 mt-1">
                  Best: {streak.longestStreak} days
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
