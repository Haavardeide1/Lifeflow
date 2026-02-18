'use client';

import { useEffect } from 'react';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { QuickCheckinCTA } from '@/components/dashboard/QuickCheckinCTA';
import { HealthScoreGraph } from '@/components/dashboard/HealthScoreGraph';
import { TodayStats } from '@/components/dashboard/TodayStats';
import { StreakCards } from '@/components/dashboard/StreakCards';
import { WeeklySummary } from '@/components/dashboard/WeeklySummary';
import { Card } from '@/components/shared/Card';
import { downloadCSV, downloadJSON } from '@/lib/export';
import {
  Mountain,
  Download,
  Target,
  BarChart3,
  Eye,
  Shield,
  Flame,
  Trophy,
} from 'lucide-react';
import type { TimePeriod } from '@/types';
import Link from 'next/link';

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All' },
];

export default function HomePage() {
  const habits = useLifeflowStore((s) => s.habits);
  const entries = useLifeflowStore((s) => s.entries);
  const selectedPeriod = useUIStore((s) => s.selectedPeriod);
  const setSelectedPeriod = useUIStore((s) => s.setSelectedPeriod);
  const user = useAuthStore((s) => s.user);
  const friends = useProfileStore((s) => s.friends);
  const fetchFriends = useProfileStore((s) => s.fetchFriends);

  const hasEntries = Object.keys(entries).length > 0;

  useEffect(() => {
    if (user) fetchFriends(user.id);
  }, [user, fetchFriends]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* Hero */}
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-5">
            <Mountain size={32} className="text-white" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight">LifeFlow</h1>
          <p className="text-[15px] text-gray-500 dark:text-white/50 mt-2 max-w-md mx-auto leading-relaxed">
            Get a better flow in your life.
          </p>
        </div>

        {/* Quick Check-in */}
        <QuickCheckinCTA />

        {/* Friends Activity */}
        {friends.length > 0 && (
          <Card title="Friends">
            <div className="divide-y divide-gray-200 dark:divide-white/[0.04]">
              {friends
                .sort((a, b) => (b.latestHealthScore ?? 0) - (a.latestHealthScore ?? 0))
                .map((friend, i) => (
                <div key={friend.userId} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-[12px] font-bold text-gray-300 dark:text-white/20 w-4">{i + 1}</span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: friend.avatarColor }}
                  >
                    {(friend.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">@{friend.username}</p>
                    {friend.lastCheckinDate && (
                      <p className="text-[11px] text-gray-400 dark:text-white/30">
                        Last check-in: {friend.lastCheckinDate}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {friend.latestHealthScore !== null && (
                      <div className="flex items-center gap-1">
                        <Trophy size={12} className="text-amber-400" />
                        <span className="text-[13px] font-bold text-emerald-400">
                          {friend.latestHealthScore}
                        </span>
                      </div>
                    )}
                    {friend.currentStreakDays > 0 && (
                      <div className="flex items-center gap-1">
                        <Flame size={12} className="text-orange-400" />
                        <span className="text-[12px] text-gray-500 dark:text-white/50">
                          {friend.currentStreakDays}d
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Dashboard Stats */}
        {hasEntries && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold">Your Dashboard</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => downloadCSV(habits, entries)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <Download size={12} />
                  CSV
                </button>
                <button
                  onClick={() => downloadJSON(habits, entries)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <Download size={12} />
                  JSON
                </button>
              </div>
            </div>

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
                          ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-400 dark:text-white/30 hover:text-gray-500 dark:hover:text-white/50'
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
        )}

        {/* About Section */}
        <div className="space-y-10 pt-4">
          <div className="h-px bg-gray-200 dark:bg-white/[0.06]" />

          {/* Intro */}
          <div className="space-y-4">
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              LifeFlow is built on two powerful truths: small habits shape who you become, and the biggest obstacle to change is often yourself.
            </p>
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              You don&apos;t need a new personality. You don&apos;t need a dramatic reset. You need small, repeatable actions — and the awareness to see what they&apos;re actually doing to you.
            </p>
          </div>

          {/* Not About Perfection */}
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold">This Is Not About Perfection.</h2>
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              LifeFlow isn&apos;t about rebuilding your life from scratch. It&apos;s about asking:
            </p>
            <div className="space-y-2.5 pl-1">
              {[
                'What happens when I train consistently for 14 days?',
                'How does reading before bed affect my mood?',
                'What changes when I reduce my screen time?',
                'Does showing up daily increase my energy?',
              ].map((q, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  <p className="text-[14px] text-gray-600 dark:text-white/60">{q}</p>
                </div>
              ))}
            </div>
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              Because change isn&apos;t theoretical — it&apos;s measurable. And often, it&apos;s subtle.
            </p>
            <p className="text-[14px] text-gray-600 dark:text-white/60 leading-relaxed font-medium">
              1% better doesn&apos;t look impressive today. But 1% easier, 1% calmer, 1% more disciplined — compounded — changes everything.
            </p>
          </div>

          {/* Know Your Patterns */}
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold">Know Your Patterns. Know Yourself.</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Target, text: 'Track habits that matter to you' },
                { icon: BarChart3, text: 'See how consistency impacts mood and energy' },
                { icon: Eye, text: 'Recognize patterns in your behavior' },
                { icon: Shield, text: 'Build identity through repetition' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]">
                  <Icon size={16} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-[13px] text-gray-600 dark:text-white/60">{text}</p>
                </div>
              ))}
            </div>
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              You don&apos;t just log habits. You learn what actually works for you.
            </p>
          </div>

          {/* Accountability */}
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold">Accountability — On Your Terms</h2>
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              Habits are deeply personal. Sometimes you don&apos;t want to explain why you&apos;re trying to use your phone less, wake up earlier, train more, or drink less. And you shouldn&apos;t have to.
            </p>
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              LifeFlow gives you private accountability — a place where your commitments live without judgment.
            </p>
            <p className="text-[14px] text-gray-600 dark:text-white/60 leading-relaxed">
              But growth doesn&apos;t have to be isolated. You can share progress without sharing details. You can celebrate consistency without explaining your struggle. Because sometimes, knowing someone sees your effort is enough.
            </p>
          </div>

          {/* The Mountain */}
          <div className="space-y-4 pb-2">
            <h2 className="text-[18px] font-bold">The Mountain Is You.</h2>
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              The resistance. The excuses. The delay. The comfort zone.
            </p>
            <p className="text-[14px] text-gray-600 dark:text-white/60 leading-relaxed">
              LifeFlow doesn&apos;t fight the mountain for you. It helps you see it clearly — and climb it one step at a time.
            </p>
          </div>

          {/* CTA */}
          {!hasEntries && (
            <div className="text-center py-4">
              <Link
                href="/checkin"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[14px] font-semibold text-white transition-colors"
              >
                <Mountain size={18} />
                Start Your First Check-in
              </Link>
            </div>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
