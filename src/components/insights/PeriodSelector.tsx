'use client';

import type { TimePeriod } from '@/types';

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All time' },
];

interface PeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
            value === p.value
              ? 'bg-white/10 text-white'
              : 'text-white/30 hover:text-white/50'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
