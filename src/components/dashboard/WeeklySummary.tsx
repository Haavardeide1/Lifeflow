'use client';

import { useMemo } from 'react';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import { Card } from '@/components/shared/Card';
import { today, addDays, getDaysBetween } from '@/lib/dateUtils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function WeeklySummary() {
  const entries = useLifeflowStore((s) => s.entries);
  const habits = useLifeflowStore((s) => s.habits);

  const summary = useMemo(() => {
    const todayStr = today();
    // This week: last 7 days
    const thisWeekStart = addDays(todayStr, -6);
    const thisWeekDates = getDaysBetween(thisWeekStart, todayStr);
    const thisWeekEntries = thisWeekDates.map(d => entries[d]).filter(Boolean);

    // Last week: 7 days before that
    const lastWeekEnd = addDays(thisWeekStart, -1);
    const lastWeekStart = addDays(lastWeekEnd, -6);
    const lastWeekDates = getDaysBetween(lastWeekStart, lastWeekEnd);
    const lastWeekEntries = lastWeekDates.map(d => entries[d]).filter(Boolean);

    if (thisWeekEntries.length === 0) return null;

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const thisAvgScore = avg(thisWeekEntries.map(e => e.healthScore));
    const lastAvgScore = lastWeekEntries.length > 0 ? avg(lastWeekEntries.map(e => e.healthScore)) : null;

    const thisAvgMood = avg(thisWeekEntries.map(e => e.mood));
    const lastAvgMood = lastWeekEntries.length > 0 ? avg(lastWeekEntries.map(e => e.mood)) : null;

    // Good habit completion rate this week
    const activeGoodHabits = Object.values(habits).filter(h => h.active && h.type === 'good');
    let goodDone = 0;
    let goodTotal = 0;
    thisWeekEntries.forEach(e => {
      activeGoodHabits.forEach(h => {
        goodTotal++;
        const hc = e.habitCompletions.find(c => c.habitId === h.id);
        if (hc?.completed) goodDone++;
      });
    });
    const goodRate = goodTotal > 0 ? Math.round((goodDone / goodTotal) * 100) : 0;

    // Bad habit avoidance rate
    const activeBadHabits = Object.values(habits).filter(h => h.active && h.type === 'bad');
    let badAvoided = 0;
    let badTotal = 0;
    thisWeekEntries.forEach(e => {
      activeBadHabits.forEach(h => {
        badTotal++;
        const hc = e.habitCompletions.find(c => c.habitId === h.id);
        if (!hc?.completed) badAvoided++;
      });
    });
    const avoidRate = badTotal > 0 ? Math.round((badAvoided / badTotal) * 100) : 0;

    return {
      checkinDays: thisWeekEntries.length,
      thisAvgScore,
      lastAvgScore,
      scoreDelta: lastAvgScore !== null ? thisAvgScore - lastAvgScore : null,
      thisAvgMood,
      lastAvgMood,
      moodDelta: lastAvgMood !== null ? thisAvgMood - lastAvgMood : null,
      goodRate,
      avoidRate,
    };
  }, [entries, habits]);

  if (!summary) return null;

  const TrendIcon = ({ delta }: { delta: number | null }) => {
    if (delta === null) return <Minus size={14} className="text-white/20" />;
    if (delta > 0.3) return <TrendingUp size={14} className="text-emerald-400" />;
    if (delta < -0.3) return <TrendingDown size={14} className="text-red-400" />;
    return <Minus size={14} className="text-white/30" />;
  };

  const deltaText = (delta: number | null) => {
    if (delta === null) return 'No prior data';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)} vs last week`;
  };

  return (
    <Card title={`This Week (${summary.checkinDays}/7 days)`}>
      <div className="px-5 py-4 grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-white/30">Avg Score</p>
            <TrendIcon delta={summary.scoreDelta} />
          </div>
          <p className="text-[22px] font-bold text-emerald-400">{summary.thisAvgScore.toFixed(1)}</p>
          <p className="text-[10px] text-white/25">{deltaText(summary.scoreDelta)}</p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-white/30">Avg Mood</p>
            <TrendIcon delta={summary.moodDelta} />
          </div>
          <p className="text-[22px] font-bold text-blue-400">{summary.thisAvgMood.toFixed(1)}</p>
          <p className="text-[10px] text-white/25">{deltaText(summary.moodDelta)}</p>
        </div>
        <div>
          <p className="text-[11px] text-white/30">Good Habits Done</p>
          <p className="text-[18px] font-semibold text-emerald-400">{summary.goodRate}%</p>
        </div>
        <div>
          <p className="text-[11px] text-white/30">Bad Habits Avoided</p>
          <p className="text-[18px] font-semibold text-orange-400">{summary.avoidRate}%</p>
        </div>
      </div>
    </Card>
  );
}
