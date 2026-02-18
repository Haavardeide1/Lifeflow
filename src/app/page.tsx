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
  Quote,
  ArrowRight,
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
      <div className="relative max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Ambient background */}
        <div className="absolute inset-x-0 -top-6 h-56 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_60%)]" />
          <div className="absolute -right-8 -top-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -left-10 top-6 w-36 h-36 rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        {/* ── Hero ── */}
        <div className="relative text-center py-12 animate-fade-in-up">
          {/* Glow ring behind icon */}
          <div className="absolute inset-0 flex items-start justify-center pt-4 pointer-events-none">
            <div className="w-32 h-32 rounded-full bg-emerald-500/25 blur-2xl animate-glow-pulse" />
          </div>

          <div className="relative">
            <div className="w-18 h-18 w-[78px] h-[78px] rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/30 animate-float">
              <Mountain size={34} className="text-white" />
            </div>
            <h1 className="text-[40px] sm:text-[44px] font-bold tracking-tight text-gradient-emerald">
              LifeFlow
            </h1>
            <p className="text-[15px] text-gray-500 dark:text-white/60 mt-2 max-w-md mx-auto leading-relaxed">
              Get a better flow in your life.
            </p>
          </div>
        </div>

        {/* ── Quick Check-in ── */}
        <div className="animate-fade-in-up delay-100">
          <QuickCheckinCTA />
        </div>

        {/* ── Friends Activity ── */}
        {friends.length > 0 && (
          <div className="animate-fade-in-up delay-200">
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
          </div>
        )}

        {/* ── Dashboard Stats ── */}
        {hasEntries && (
          <>
            <div className="flex items-center justify-between animate-fade-in-up delay-200">
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

        {/* ── About Section ── */}
        <div className="space-y-12 pt-6">
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

          {/* Intro */}
          <div className="space-y-4 animate-fade-in-up">
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              LifeFlow is built on two powerful truths: small habits shape who you become, and the biggest obstacle to change is often yourself.
            </p>
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              You don&apos;t need a new personality. You don&apos;t need a dramatic reset. You need small, repeatable actions — and the awareness to see what they&apos;re actually doing to you.
            </p>
          </div>

          {/* Not About Perfection */}
          <div className="space-y-5 animate-fade-in-up">
            <h2 className="text-[20px] font-bold tracking-tight">
              This Is Not About Perfection.
            </h2>
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              LifeFlow isn&apos;t about rebuilding your life from scratch. It&apos;s about asking:
            </p>
            <div className="space-y-2 pl-1">
              {[
                'What happens when I train consistently for 14 days?',
                'How does reading before bed affect my mood?',
                'What changes when I reduce my screen time?',
                'Does showing up daily increase my energy?',
              ].map((q, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-500/[0.05] dark:bg-emerald-500/[0.06] border border-emerald-500/10 dark:border-emerald-500/10"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <p className="text-[13.5px] text-gray-600 dark:text-white/60">{q}</p>
                </div>
              ))}
            </div>
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              Because change isn&apos;t theoretical — it&apos;s measurable. And often, it&apos;s subtle.
            </p>

            {/* Highlighted quote */}
            <div className="relative pl-5 border-l-2 border-emerald-500/50 py-1">
              <Quote size={14} className="absolute -left-[7px] -top-0.5 text-emerald-500/50 bg-white dark:bg-[#0a0a0a]" />
              <p className="text-[14px] text-gray-700 dark:text-white/70 leading-relaxed font-medium italic">
                1% better doesn&apos;t look impressive today. But 1% easier, 1% calmer, 1% more disciplined — compounded — changes everything.
              </p>
            </div>
          </div>

          {/* Know Your Patterns */}
          <div className="space-y-5 animate-fade-in-up">
            <h2 className="text-[20px] font-bold tracking-tight">
              Know Your Patterns. Know Yourself.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Target, text: 'Track habits that matter to you', color: 'emerald' },
                { icon: BarChart3, text: 'See how consistency impacts mood and energy', color: 'blue' },
                { icon: Eye, text: 'Recognize patterns in your behavior', color: 'purple' },
                { icon: Shield, text: 'Build identity through repetition', color: 'amber' },
              ].map(({ icon: Icon, text, color }, i) => {
                const colorMap: Record<string, string> = {
                  emerald: 'from-emerald-500/10 to-emerald-500/[0.02] border-emerald-500/15 text-emerald-500',
                  blue: 'from-blue-500/10 to-blue-500/[0.02] border-blue-500/15 text-blue-500',
                  purple: 'from-purple-500/10 to-purple-500/[0.02] border-purple-500/15 text-purple-500',
                  amber: 'from-amber-500/10 to-amber-500/[0.02] border-amber-500/15 text-amber-500',
                };
                const cls = colorMap[color];
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-gradient-to-br border shadow-sm shadow-black/10 ${cls.split(' ').slice(0, 3).join(' ')}`}
                  >
                    <Icon size={18} className={`flex-shrink-0 ${cls.split(' ').slice(3).join(' ')}`} />
                    <p className="text-[13px] text-gray-600 dark:text-white/60">{text}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
              You don&apos;t just log habits. You learn what actually works for you.
            </p>
          </div>

          {/* Accountability */}
          <div className="space-y-5 animate-fade-in-up">
            <h2 className="text-[20px] font-bold tracking-tight">
              Accountability — On Your Terms
            </h2>
            <div className="space-y-3">
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
          </div>

          {/* The Mountain */}
          <div className="animate-fade-in-up">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-900/25 via-emerald-800/10 to-transparent dark:from-emerald-900/35 dark:via-emerald-800/15 dark:to-transparent border border-emerald-500/10 p-6 space-y-4 shadow-lg shadow-emerald-500/10">
              <div className="absolute top-4 right-4 opacity-10">
                <Mountain size={64} />
              </div>
              <h2 className="text-[20px] font-bold tracking-tight relative">
                The Climb Is Yours.
              </h2>
              <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed relative">
                The resistance. The excuses. The delay. The comfort zone.
              </p>
              <p className="text-[14px] text-gray-600 dark:text-white/60 leading-relaxed relative">
                LifeFlow doesn&apos;t fight the mountain for you. It helps you see it clearly — and climb it one step at a time.
              </p>
            </div>
          </div>

          {/* CTA */}
          {!hasEntries && (
            <div className="text-center py-4 animate-fade-in-up">
              <Link
                href="/checkin"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-[14px] font-semibold text-white transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                <Mountain size={18} />
                Start Your First Check-in
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </div>

        <div className="h-8" />

        {/* Footer */}
        <div className="pt-2 pb-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[12px] text-gray-400 dark:text-white/35">
              Created and powered by
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <span className="text-[11px] text-white/70">Claude</span>
                <span className="w-px h-3 bg-white/15" />
                <span className="text-[11px] text-white/70">OpenAI</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/80 to-emerald-400/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 12.5c2.2-2.9 5.2-4.4 9-4.5M6 16.5c2.2-2.9 5.2-4.4 9-4.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/80">Made by</span>
                <span className="text-[18px] font-semibold tracking-tight text-white/90 font-mono">Slopify</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
