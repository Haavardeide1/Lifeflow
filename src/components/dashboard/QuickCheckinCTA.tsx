'use client';

import Link from 'next/link';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import { today } from '@/lib/dateUtils';
import { ClipboardCheck, Check } from 'lucide-react';

export function QuickCheckinCTA() {
  const entries = useLifeflowStore((s) => s.entries);
  const hasCheckedIn = !!entries[today()];

  if (hasCheckedIn) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <Check size={18} className="text-emerald-400" />
        <span className="text-[13px] text-emerald-400/80">You&apos;ve checked in today</span>
        <Link
          href="/checkin"
          className="ml-auto text-[12px] text-emerald-400/60 hover:text-emerald-400 transition-colors"
        >
          Edit
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/checkin"
      className="flex items-center gap-3 px-4 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors"
    >
      <ClipboardCheck size={20} />
      <div>
        <p className="text-[14px] font-semibold">Check in for today</p>
        <p className="text-[12px] text-white/70">How was your day?</p>
      </div>
    </Link>
  );
}
