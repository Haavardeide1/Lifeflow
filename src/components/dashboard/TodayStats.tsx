'use client';

import { useLifeflowStore } from '@/stores/lifeflowStore';
import { today } from '@/lib/dateUtils';
import { Card } from '@/components/shared/Card';

export function TodayStats() {
  const entries = useLifeflowStore((s) => s.entries);
  const habits = useLifeflowStore((s) => s.habits);
  const todayEntry = entries[today()];

  if (!todayEntry) return null;

  const activeHabits = Object.values(habits).filter(h => h.active);
  const goodDone = todayEntry.habitCompletions.filter(hc => {
    const h = habits[hc.habitId];
    return h?.active && h.type === 'good' && hc.completed;
  }).length;
  const goodTotal = activeHabits.filter(h => h.type === 'good').length;
  const badDone = todayEntry.habitCompletions.filter(hc => {
    const h = habits[hc.habitId];
    return h?.active && h.type === 'bad' && hc.completed;
  }).length;
  const badTotal = activeHabits.filter(h => h.type === 'bad').length;

  const scoreColor = todayEntry.healthScore >= 7 ? '#22c55e'
    : todayEntry.healthScore >= 4 ? '#eab308' : '#ef4444';

  return (
    <Card>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between">
          {/* Health Score */}
          <div>
            <p className="text-[12px] text-gray-400 dark:text-white/40 uppercase tracking-wider font-medium">Health Score</p>
            <p className="text-[40px] font-bold leading-none mt-1" style={{ color: scoreColor }}>
              {todayEntry.healthScore}
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[11px] text-gray-400 dark:text-white/30">Mood</p>
              <p className="text-[18px] font-semibold text-blue-400">{todayEntry.mood}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 dark:text-white/30">Energy</p>
              <p className="text-[18px] font-semibold text-orange-400">{todayEntry.energy}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 dark:text-white/30">Sleep</p>
              <p className="text-[18px] font-semibold text-purple-400">{todayEntry.sleep}</p>
            </div>
          </div>
        </div>

        {/* Habit summary */}
        <div className="flex gap-4 mt-4 pt-3 border-t border-gray-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[12px] text-gray-500 dark:text-white/50">
              {goodDone}/{goodTotal} good habits
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[12px] text-gray-500 dark:text-white/50">
              {badTotal - badDone}/{badTotal} bad habits avoided
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
