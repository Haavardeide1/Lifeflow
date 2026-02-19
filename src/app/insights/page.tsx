'use client';

import { useLifeflowStore } from '@/stores/lifeflowStore';
import { useUIStore } from '@/stores/uiStore';
import { PeriodSelector } from '@/components/insights/PeriodSelector';
import { CorrelationChart } from '@/components/insights/CorrelationChart';
import { TrendLines } from '@/components/insights/TrendLines';
import { HabitHeatmap } from '@/components/insights/HabitHeatmap';
import { RadarChart } from '@/components/insights/RadarChart';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import Link from 'next/link';

export default function InsightsPage() {
  const habits = useLifeflowStore((s) => s.habits);
  const entries = useLifeflowStore((s) => s.entries);
  const selectedPeriod = useUIStore((s) => s.selectedPeriod);
  const setSelectedPeriod = useUIStore((s) => s.setSelectedPeriod);

  const entryCount = Object.keys(entries).length;

  if (entryCount === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-[20px] font-semibold mb-6">Insights</h1>
          <EmptyState
            title="No data yet"
            description="Check in for a few days to start seeing insights about how your habits affect your mood."
            action={
              <Link
                href="/checkin"
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[13px] font-medium text-white transition-colors"
              >
                Start checking in
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold">Insights</h1>
          <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
        </div>

        <Card title="Habit Impact on Mood">
          <div className="px-2 pb-2">
            <CorrelationChart habits={habits} entries={entries} />
          </div>
          <div className="px-5 pb-4">
            <p className="text-[11px] text-gray-400 dark:text-white/25">
              Bars show Pearson correlation with your mood rating. Green = positive, Red = negative. Need 3+ days of data.
            </p>
          </div>
        </Card>

        <Card title="Trends">
          <div className="pt-3 pb-2">
            <TrendLines entries={entries} period={selectedPeriod} />
          </div>
        </Card>

        <Card title="Habit Completion Radar">
          <div className="p-4">
            <RadarChart habits={habits} entries={entries} period={selectedPeriod} />
          </div>
          <div className="px-5 pb-4">
            <p className="text-[11px] text-gray-400 dark:text-white/25">
              Good habits: bigger = more done. Bad habits: bigger = more avoided. Green area = your performance.
            </p>
          </div>
        </Card>

        <Card title="Habit Consistency">
          <div className="p-4">
            <HabitHeatmap habits={habits} entries={entries} period={selectedPeriod} />
          </div>
        </Card>

        {entryCount >= 3 && (
          <Card title="Summary">
            <div className="px-5 py-4">
              <SummaryStats entries={entries} habits={habits} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function SummaryStats({
  entries,
}: {
  entries: Record<string, import('@/types').DailyEntry>;
  habits: Record<string, import('@/types').Habit>;
}) {
  const entryList = Object.values(entries).sort((a, b) => b.date.localeCompare(a.date));
  const avgMood = entryList.reduce((s, e) => s + e.mood, 0) / entryList.length;
  const avgEnergy = entryList.reduce((s, e) => s + e.energy, 0) / entryList.length;
  const avgSleep = entryList.reduce((s, e) => s + e.sleep, 0) / entryList.length;
  const avgScore = entryList.reduce((s, e) => s + e.healthScore, 0) / entryList.length;
  const bestDay = entryList.reduce((best, e) => e.healthScore > best.healthScore ? e : best);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-[11px] text-gray-400 dark:text-white/30">Avg Consistency Score</p>
        <p className="text-[20px] font-bold text-emerald-400">{avgScore.toFixed(1)}</p>
      </div>
      <div>
        <p className="text-[11px] text-gray-400 dark:text-white/30">Best Day</p>
        <p className="text-[14px] font-semibold text-gray-700 dark:text-white/80">{bestDay.date}</p>
        <p className="text-[11px] text-emerald-400/60">Consistency: {bestDay.healthScore}</p>
      </div>
      <div>
        <p className="text-[11px] text-gray-400 dark:text-white/30">Avg Mood</p>
        <p className="text-[18px] font-semibold text-blue-400">{avgMood.toFixed(1)}</p>
      </div>
      <div>
        <p className="text-[11px] text-gray-400 dark:text-white/30">Avg Energy</p>
        <p className="text-[18px] font-semibold text-orange-400">{avgEnergy.toFixed(1)}</p>
      </div>
      <div>
        <p className="text-[11px] text-gray-400 dark:text-white/30">Avg Sleep</p>
        <p className="text-[18px] font-semibold text-purple-400">{avgSleep.toFixed(1)}</p>
      </div>
      <div>
        <p className="text-[11px] text-gray-400 dark:text-white/30">Total Entries</p>
        <p className="text-[18px] font-semibold text-gray-600 dark:text-white/70">{entryList.length}</p>
      </div>
    </div>
  );
}
