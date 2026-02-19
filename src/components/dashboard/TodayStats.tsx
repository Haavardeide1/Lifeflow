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

  const consistencyScore = todayEntry.healthScore;
  const wellbeingScore = (todayEntry.mood + todayEntry.energy + todayEntry.sleep) / 3;

  const scoreColor = consistencyScore >= 7 ? '#22c55e'
    : consistencyScore >= 4 ? '#eab308' : '#ef4444';

  const getTier = (value: number) => (value >= 7 ? 'high' : value <= 4 ? 'low' : 'mid');
  const consistencyTier = getTier(consistencyScore);
  const wellbeingTier = getTier(wellbeingScore);

  const insightMap: Record<string, string> = {
    'high-high': 'Aligned: strong consistency and strong wellbeing.',
    'high-low': 'Pushing hard: consistency is high, wellbeing is low.',
    'low-high': 'Recovery day: wellbeing is high with low consistency.',
    'low-low': 'Drift phase: low consistency and low wellbeing.',
  };
  const insightKey = `${consistencyTier}-${wellbeingTier}`;
  const insightText = insightMap[insightKey] ?? 'Mixed signals today. Notice what supported or drained you.';

  return (
    <Card>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between">
          {/* Consistency Score */}
          <div>
            <p className="text-[12px] text-gray-400 dark:text-white/40 uppercase tracking-wider font-medium">Consistency Score</p>
            <p className="text-[40px] font-bold leading-none mt-1" style={{ color: scoreColor }}>
              {consistencyScore}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/35 mt-1">What you did</p>
          </div>

          {/* Wellbeing / State */}
          <div className="text-right">
            <p className="text-[12px] text-gray-400 dark:text-white/40 uppercase tracking-wider font-medium">Wellbeing</p>
            <p className="text-[24px] font-semibold text-white/80 dark:text-white/80">{wellbeingScore.toFixed(1)}</p>
            <p className="text-[11px] text-gray-400 dark:text-white/35 mt-1">How you felt</p>
            <div className="grid grid-cols-3 gap-3 text-center mt-3">
              <div>
                <p className="text-[10px] text-gray-400 dark:text-white/30">Mood</p>
                <p className="text-[16px] font-semibold text-blue-400">{todayEntry.mood}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-white/30">Energy</p>
                <p className="text-[16px] font-semibold text-orange-400">{todayEntry.energy}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-white/30">Sleep</p>
                <p className="text-[16px] font-semibold text-purple-400">{todayEntry.sleep}</p>
              </div>
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

        {/* Insight */}
        <div className="mt-3 text-[12px] text-gray-500 dark:text-white/50">
          {insightText}
        </div>
      </div>
    </Card>
  );
}
