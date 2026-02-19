'use client';

import { useMemo, useState, useEffect } from 'react';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { today, addDays, getDaysBetween } from '@/lib/dateUtils';
import type { Wish, WishMetric } from '@/types';
import { Plus, Trash2, Sparkles, Target, Activity } from 'lucide-react';

const METRIC_OPTIONS: { value: WishMetric; label: string; color: string }[] = [
  { value: 'energy', label: 'Energy', color: '#f97316' },
  { value: 'mood', label: 'Mood', color: '#3b82f6' },
  { value: 'sleep', label: 'Sleep', color: '#a855f7' },
  { value: 'healthScore', label: 'Health Score', color: '#22c55e' },
];

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function WishesPage() {
  const habits = useLifeflowStore((s) => s.habits);
  const entries = useLifeflowStore((s) => s.entries);
  const wishes = useLifeflowStore((s) => s.wishes);
  const addWish = useLifeflowStore((s) => s.addWish);
  const updateWish = useLifeflowStore((s) => s.updateWish);
  const deleteWish = useLifeflowStore((s) => s.deleteWish);

  const activeHabits = useMemo(
    () => Object.values(habits).filter((h) => h.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [habits]
  );

  const [kind, setKind] = useState<Wish['kind']>('habit');
  const [title, setTitle] = useState('');
  const [habitId, setHabitId] = useState(activeHabits[0]?.id ?? '');
  const [targetPerWeek, setTargetPerWeek] = useState(3);
  const [metric, setMetric] = useState<WishMetric>('energy');
  const [targetValue, setTargetValue] = useState(7);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleTouched, setTitleTouched] = useState(false);

  const weekData = useMemo(() => {
    const end = today();
    const start = addDays(end, -6);
    const dates = getDaysBetween(start, end);
    const weekEntries = dates.map((d) => entries[d]).filter(Boolean);
    return { start, end, dates, weekEntries };
  }, [entries]);

  const weekStats = useMemo(() => {
    const habitCounts: Record<string, number> = {};
    const metricSums: Record<WishMetric, number> = {
      energy: 0,
      mood: 0,
      sleep: 0,
      healthScore: 0,
    };
    const entryCount = weekData.weekEntries.length;

    for (const entry of weekData.weekEntries) {
      metricSums.energy += entry.energy;
      metricSums.mood += entry.mood;
      metricSums.sleep += entry.sleep;
      metricSums.healthScore += entry.healthScore;

      for (const hc of entry.habitCompletions) {
        if (!hc.completed) continue;
        habitCounts[hc.habitId] = (habitCounts[hc.habitId] ?? 0) + 1;
      }
    }

    const metricAverages: Record<WishMetric, number> = {
      energy: entryCount > 0 ? metricSums.energy / entryCount : 0,
      mood: entryCount > 0 ? metricSums.mood / entryCount : 0,
      sleep: entryCount > 0 ? metricSums.sleep / entryCount : 0,
      healthScore: entryCount > 0 ? metricSums.healthScore / entryCount : 0,
    };

    return { habitCounts, metricAverages };
  }, [weekData.weekEntries]);

  useEffect(() => {
    if (!habitId && activeHabits.length > 0) {
      setHabitId(activeHabits[0].id);
    }
  }, [habitId, activeHabits]);

  useEffect(() => {
    if (titleTouched) return;
    if (kind === 'habit') {
      const habitTitle = habits[habitId]?.name ?? '';
      if (habitTitle) setTitle(habitTitle);
    } else {
      const metricLabel = METRIC_OPTIONS.find((m) => m.value === metric)?.label ?? 'Wellbeing goal';
      setTitle(`Better ${metricLabel.toLowerCase()}`);
    }
  }, [titleTouched, kind, habitId, metric, habits]);

  const habitWishData = useMemo(() => {
    return Object.values(wishes)
      .filter((w) => w.active && w.kind === 'habit' && w.habitId)
      .map((w) => {
        const habit = habits[w.habitId!];
        const actual = weekStats.habitCounts[w.habitId!] ?? 0;
        const target = w.targetPerWeek ?? 0;
        const ratio = target > 0 ? Math.min(1, actual / target) : 0;
        return {
          wish: w,
          habit,
          actual,
          target,
          ratio,
        };
      })
      .sort((a, b) => b.actual - a.actual);
  }, [wishes, habits, weekStats.habitCounts]);

  const habitTotals = useMemo(() => {
    const totalActual = habitWishData.reduce((sum, h) => sum + h.actual, 0);
    const totalTarget = habitWishData.reduce((sum, h) => sum + h.target, 0);
    const ratio = totalTarget > 0 ? Math.min(1, totalActual / totalTarget) : 0;
    return { totalActual, totalTarget, ratio };
  }, [habitWishData]);

  const metricWishData = useMemo(() => {
    return Object.values(wishes)
      .filter((w) => w.active && w.kind === 'metric' && w.metric)
      .map((w) => {
        const metricKey = w.metric!;
        const actual = weekStats.metricAverages[metricKey];
        const target = w.targetValue ?? 0;
        return {
          wish: w,
          metricKey,
          actual,
          target,
        };
      })
      .sort((a, b) => b.actual - a.actual);
  }, [wishes, weekStats.metricAverages]);

  const hasWishes = Object.values(wishes).some((w) => w.active);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (kind === 'habit' && !habitId) return;
    const resolvedTitle = title.trim() || (kind === 'habit' ? habits[habitId]?.name : 'Wellbeing goal');

    if (!resolvedTitle) return;

    if (editingId) {
      updateWish(editingId, {
        title: resolvedTitle,
        kind,
        habitId: kind === 'habit' ? habitId : undefined,
        metric: kind === 'metric' ? metric : undefined,
        targetPerWeek: kind === 'habit' ? clampNumber(targetPerWeek, 1, 7) : undefined,
        targetValue: kind === 'metric' ? clampNumber(targetValue, 1, 10) : undefined,
      });
    } else {
      addWish({
        title: resolvedTitle,
        kind,
        habitId: kind === 'habit' ? habitId : undefined,
        metric: kind === 'metric' ? metric : undefined,
        targetPerWeek: kind === 'habit' ? clampNumber(targetPerWeek, 1, 7) : undefined,
        targetValue: kind === 'metric' ? clampNumber(targetValue, 1, 10) : undefined,
      });
    }

    setTitle('');
    setEditingId(null);
    setTitleTouched(false);
  };

  const habitLabel = (habitIdValue?: string) => habits[habitIdValue || '']?.name || 'Unknown habit';

  const startEdit = (wish: Wish) => {
    setEditingId(wish.id);
    setKind(wish.kind);
    setTitle(wish.title);
    setTitleTouched(true);
    if (wish.kind === 'habit') {
      setHabitId(wish.habitId ?? activeHabits[0]?.id ?? '');
      setTargetPerWeek(wish.targetPerWeek ?? 3);
    } else {
      setMetric(wish.metric ?? 'energy');
      setTargetValue(wish.targetValue ?? 7);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setTitleTouched(false);
  };

  const isSubmitDisabled = kind === 'habit' && !habitId;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-semibold">Wishes & Goals</h1>
            <p className="text-[12px] text-gray-400 dark:text-white/40">
              Compare how your week actually went against what you want.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium">
            <Sparkles size={12} />
            Week view
          </div>
        </div>

        <Card title={editingId ? 'Edit Wish' : 'Add Wish'}>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-gray-400 dark:text-white/40 mb-1">Title</label>
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setTitleTouched(true);
                  }}
                  placeholder={kind === 'habit' ? 'Run more, read at night...' : 'Higher energy all week'}
                  className="w-full rounded-lg bg-white/70 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] px-3 py-2 text-[13px]"
                />
                <p className="text-[10px] text-gray-400 dark:text-white/30 mt-1">
                  Leave empty to auto-use the habit or goal name.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-400 dark:text-white/40 mb-1">Type</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as Wish['kind'])}
                    className="w-full rounded-lg bg-white/70 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] px-3 py-2 text-[13px]"
                  >
                    <option value="habit">Habit wish</option>
                    <option value="metric">Wellbeing goal</option>
                  </select>
                </div>
                {kind === 'habit' ? (
                  <div>
                    <label className="block text-[11px] text-gray-400 dark:text-white/40 mb-1">Habit</label>
                    <select
                      value={habitId}
                      onChange={(e) => setHabitId(e.target.value)}
                      className="w-full rounded-lg bg-white/70 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] px-3 py-2 text-[13px]"
                    >
                      {activeHabits.length === 0 && <option value="">No habits yet</option>}
                      {activeHabits.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-gray-400 dark:text-white/40 mb-1">Metric</label>
                    <select
                      value={metric}
                      onChange={(e) => setMetric(e.target.value as WishMetric)}
                      className="w-full rounded-lg bg-white/70 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] px-3 py-2 text-[13px]"
                    >
                      {METRIC_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {kind === 'habit' ? (
                <div>
                  <label className="block text-[11px] text-gray-400 dark:text-white/40 mb-1">Target / week</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={targetPerWeek}
                    onChange={(e) => setTargetPerWeek(Number(e.target.value))}
                    className="w-full rounded-lg bg-white/70 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] px-3 py-2 text-[13px]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] text-gray-400 dark:text-white/40 mb-1">Target value (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full rounded-lg bg-white/70 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] px-3 py-2 text-[13px]"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[13px] font-semibold text-white transition-colors inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
                {editingId ? 'Save changes' : 'Add wish'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.08] text-[13px] font-semibold text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>

        {!hasWishes ? (
          <EmptyState
            title="No wishes yet"
            description="Add a wish to compare what you want with what you do."
          />
        ) : (
          <>
            <Card
              title={`Habit Wishes vs Actual (${weekData.start} -> ${weekData.end})`}
              action={<Target size={14} className="text-emerald-400" />}
            >
              <div className="px-5 py-4 space-y-4">
                {habitWishData.length === 0 ? (
                  <p className="text-[13px] text-gray-400 dark:text-white/40">No habit wishes yet.</p>
                ) : (
                  habitWishData.map((row) => (
                    <div key={row.wish.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-medium">{row.wish.title}</p>
                          <p className="text-[11px] text-gray-400 dark:text-white/40">
                            {habitLabel(row.wish.habitId)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[12px] font-semibold text-emerald-400">
                            {row.actual}/{row.target}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-white/40">
                            {row.target > 0 ? `${Math.round(row.ratio * 100)}% of goal` : 'No target'}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${row.ratio * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-white/35">
                        <span>
                          {row.actual >= row.target
                            ? 'On track'
                            : `Gap: ${row.target - row.actual} this week`}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => startEdit(row.wish)}
                            className="inline-flex items-center gap-1 text-gray-400 hover:text-emerald-400 transition-colors"
                            title="Edit wish"
                          >
                            <Target size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteWish(row.wish.id)}
                            className="inline-flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Remove wish"
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card title="Overall Habit Target vs Actual" action={<Activity size={14} className="text-blue-400" />}>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-gray-400 dark:text-white/40">Total completions</p>
                  <p className="text-[13px] font-semibold">
                    {habitTotals.totalActual}/{habitTotals.totalTarget}
                  </p>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${habitTotals.ratio * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-white/40">
                  {habitTotals.totalTarget > 0
                    ? `${Math.round(habitTotals.ratio * 100)}% of weekly wish total`
                    : 'Add habit wishes to see totals.'}
                </p>
              </div>
            </Card>

            <Card title="Wellbeing Goals vs Actual" action={<Sparkles size={14} className="text-amber-400" />}>
              <div className="px-5 py-4 space-y-4">
                {metricWishData.length === 0 ? (
                  <p className="text-[13px] text-gray-400 dark:text-white/40">No wellbeing goals yet.</p>
                ) : (
                  metricWishData.map((row) => {
                    const metricMeta = METRIC_OPTIONS.find((m) => m.value === row.metricKey);
                    const ratio = row.target > 0 ? Math.min(1, row.actual / row.target) : 0;
                    const delta = row.actual - row.target;
                    return (
                      <div key={row.wish.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13px] font-medium">{row.wish.title}</p>
                            <p className="text-[11px] text-gray-400 dark:text-white/40">
                              {metricMeta?.label}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[12px] font-semibold" style={{ color: metricMeta?.color }}>
                              {row.actual.toFixed(1)}/{row.target.toFixed(1)}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-white/40">
                              {delta >= 0 ? `+${delta.toFixed(1)} above goal` : `${delta.toFixed(1)} below goal`}
                            </p>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200 dark:bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${ratio * 100}%`, backgroundColor: metricMeta?.color }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-white/35">
                          <span>{ratio >= 1 ? 'Goal reached' : 'Needs more support'}</span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => startEdit(row.wish)}
                              className="inline-flex items-center gap-1 text-gray-400 hover:text-emerald-400 transition-colors"
                              title="Edit wish"
                            >
                              <Target size={12} />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteWish(row.wish.id)}
                              className="inline-flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
                              title="Remove wish"
                            >
                              <Trash2 size={12} />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
