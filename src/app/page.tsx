'use client';

import { useLifeflowStore } from '@/stores/lifeflowStore';
import { useUIStore } from '@/stores/uiStore';
import { QuickCheckinCTA } from '@/components/dashboard/QuickCheckinCTA';
import { HealthScoreGraph } from '@/components/dashboard/HealthScoreGraph';
import { TodayStats } from '@/components/dashboard/TodayStats';
import { StreakCards } from '@/components/dashboard/StreakCards';
import { WeeklySummary } from '@/components/dashboard/WeeklySummary';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { downloadCSV, downloadJSON } from '@/lib/export';
import { Download } from 'lucide-react';
import type { TimePeriod } from '@/types';
import Link from 'next/link';

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All' },
];

export default function DashboardPage() {
  const habits = useLifeflowStore((s) => s.habits);
  const entries = useLifeflowStore((s) => s.entries);
  const selectedPeriod = useUIStore((s) => s.selectedPeriod);
  const setSelectedPeriod = useUIStore((s) => s.setSelectedPeriod);

  const hasEntries = Object.keys(entries).length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold">Dashboard</h1>
          {hasEntries && (
            <div className="flex gap-1">
              <button
                onClick={() => downloadCSV(habits, entries)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              >
                <Download size={12} />
                CSV
              </button>
              <button
                onClick={() => downloadJSON(habits, entries)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              >
                <Download size={12} />
                JSON
              </button>
            </div>
          )}
        </div>

        <QuickCheckinCTA />

        {hasEntries ? (
          <>
            <TodayStats />

            <Card
              title="Health Score"
              action={
                <div className="flex gap-1">
                  {PERIODS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setSelectedPeriod(p.value)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        selectedPeriod === p.value
                          ? 'bg-white/10 text-white'
                          : 'text-white/30 hover:text-white/50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="px-2 pb-2">
                <HealthScoreGraph entries={entries} period={selectedPeriod} />
              </div>
            </Card>

            <StreakCards />

            <WeeklySummary />
          </>
        ) : (
          <EmptyState
            title="Welcome to Lifeflow"
            description="Start tracking your habits and mood to see your health score over time. Your first check-in is just a tap away."
            action={
              <Link
                href="/checkin"
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[13px] font-medium text-white transition-colors"
              >
                Make your first check-in
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
