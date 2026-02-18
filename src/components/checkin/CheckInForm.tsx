'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import { useUIStore } from '@/stores/uiStore';
import type { HabitCompletion } from '@/types';
import { HabitToggle } from './HabitToggle';
import { SliderInput } from '@/components/shared/SliderInput';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDisplayDate, addDays, today, isToday, isFuture } from '@/lib/dateUtils';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';

export function CheckInForm() {
  const habits = useLifeflowStore((s) => s.habits);
  const entries = useLifeflowStore((s) => s.entries);
  const saveEntry = useLifeflowStore((s) => s.saveEntry);
  const checkinDate = useUIStore((s) => s.checkinDate);
  const setCheckinDate = useUIStore((s) => s.setCheckinDate);

  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const activeHabits = Object.values(habits)
    .filter(h => h.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const goodHabits = activeHabits.filter(h => h.type === 'good');
  const badHabits = activeHabits.filter(h => h.type === 'bad');

  const existingEntry = entries[checkinDate];
  const isUpdate = !!existingEntry;

  // Load existing entry data when date changes
  useEffect(() => {
    if (existingEntry) {
      setMood(existingEntry.mood);
      setEnergy(existingEntry.energy);
      setSleep(existingEntry.sleep);
      setNotes(existingEntry.notes);
      const comps: Record<string, boolean> = {};
      existingEntry.habitCompletions.forEach(hc => {
        comps[hc.habitId] = hc.completed;
      });
      setCompletions(comps);
    } else {
      setMood(5);
      setEnergy(5);
      setSleep(5);
      setNotes('');
      setCompletions({});
    }
    setSaved(false);
  }, [checkinDate, existingEntry]);

  // Reset checkinDate to today on mount
  useEffect(() => {
    setCheckinDate(today());
  }, [setCheckinDate]);

  const toggleHabit = useCallback((habitId: string) => {
    setCompletions(prev => ({ ...prev, [habitId]: !prev[habitId] }));
    setSaved(false);
  }, []);

  const handleSave = () => {
    const habitCompletions: HabitCompletion[] = activeHabits.map(h => ({
      habitId: h.id,
      completed: !!completions[h.id],
    }));

    saveEntry({ date: checkinDate, mood, energy, sleep, habitCompletions, notes });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const goToPrevDay = () => setCheckinDate(addDays(checkinDate, -1));
  const goToNextDay = () => {
    const next = addDays(checkinDate, 1);
    if (!isFuture(next)) setCheckinDate(next);
  };

  if (activeHabits.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6">
          <EmptyState
            title="No habits to track yet"
            description="Add some habits first, then come back here to check in."
            action={
              <Link
                href="/habits"
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[13px] font-medium text-white transition-colors"
              >
                Set up your habits
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Date Navigator */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevDay}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className="text-[18px] font-semibold">
              {isToday(checkinDate) ? 'Today' : formatDisplayDate(checkinDate)}
            </h1>
            {isToday(checkinDate) && (
              <p className="text-[12px] text-gray-400 dark:text-white/40">{formatDisplayDate(checkinDate)}</p>
            )}
            {isUpdate && (
              <p className="text-[11px] text-emerald-400/70 mt-0.5">Already checked in</p>
            )}
          </div>
          <button
            onClick={goToNextDay}
            disabled={isToday(checkinDate)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Good Habits */}
        {goodHabits.length > 0 && (
          <Card title="Good Habits">
            <div className="p-3 space-y-2">
              {goodHabits.map(h => (
                <HabitToggle
                  key={h.id}
                  habit={h}
                  completed={!!completions[h.id]}
                  onToggle={() => toggleHabit(h.id)}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Bad Habits */}
        {badHabits.length > 0 && (
          <Card title="Bad Habits">
            <div className="p-3 space-y-2">
              {badHabits.map(h => (
                <HabitToggle
                  key={h.id}
                  habit={h}
                  completed={!!completions[h.id]}
                  onToggle={() => toggleHabit(h.id)}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Mood / Energy / Sleep */}
        <Card title="How are you feeling?">
          <div className="p-5 space-y-6">
            <SliderInput
              label="Mood"
              value={mood}
              onChange={(v) => { setMood(v); setSaved(false); }}
              leftEmoji="😔"
              rightEmoji="😊"
              color="#3b82f6"
            />
            <SliderInput
              label="Energy"
              value={energy}
              onChange={(v) => { setEnergy(v); setSaved(false); }}
              leftEmoji="🪫"
              rightEmoji="⚡"
              color="#f97316"
            />
            <SliderInput
              label="Sleep Quality"
              value={sleep}
              onChange={(v) => { setSleep(v); setSaved(false); }}
              leftEmoji="😴"
              rightEmoji="🌟"
              color="#a855f7"
            />
          </div>
        </Card>

        {/* Notes */}
        <Card title="Notes">
          <div className="p-4">
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
              placeholder="Anything else to note about today?"
              className="w-full bg-transparent text-[14px] text-gray-700 dark:text-white/80 placeholder:text-gray-300 dark:placeholder:text-white/20 resize-none outline-none min-h-[80px]"
              rows={3}
            />
          </div>
        </Card>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`
            w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2
            ${saved
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }
          `}
        >
          {saved ? (
            <>
              <Check size={18} />
              Saved!
            </>
          ) : (
            isUpdate ? 'Update Entry' : 'Save Check-in'
          )}
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}
