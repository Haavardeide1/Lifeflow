'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { HabitIcon } from '@/components/shared/HabitIcon';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import type { HabitType } from '@/types';

interface HabitSuggestion {
  name: string;
  type: HabitType;
  icon: string;
  color: string;
  weight: number;
}

interface SuggestionPack {
  good: HabitSuggestion;
  bad: HabitSuggestion;
  reason: string;
}

interface AIOnboardingModalProps {
  open: boolean;
  username: string;
  onComplete: () => void;
}

const DEFAULT_SUGGESTION: SuggestionPack = {
  good: { name: '10-minute walk', type: 'good', icon: 'footprints', color: '#22c55e', weight: 5 },
  bad: { name: 'Late-night screens', type: 'bad', icon: 'phone', color: '#ef4444', weight: 5 },
  reason: 'A simple movement habit plus reducing late screens boosts energy and sleep consistency.',
};

const CATEGORIES: Array<{
  id: string;
  keywords: string[];
  good: HabitSuggestion;
  bad: HabitSuggestion;
  reason: string;
}> = [
  {
    id: 'sleep',
    keywords: ['sleep', 'tired', 'insomnia', 'bed', 'night', 'late', 'fatigue', 'rest'],
    good: { name: 'Consistent bedtime', type: 'good', icon: 'moon', color: '#6366f1', weight: 6 },
    bad: { name: 'Late-night screens', type: 'bad', icon: 'phone', color: '#ef4444', weight: 5 },
    reason: 'Sleep quality drives energy and mood. A steady bedtime and fewer late screens helps.',
  },
  {
    id: 'energy',
    keywords: ['energy', 'slump', 'exhaust', 'drained', 'motivation', 'burnout'],
    good: { name: 'Morning sunlight', type: 'good', icon: 'sun', color: '#f59e0b', weight: 5 },
    bad: { name: 'Caffeine after 2pm', type: 'bad', icon: 'coffee', color: '#ef4444', weight: 5 },
    reason: 'Light exposure and caffeine timing are simple levers for daily energy.',
  },
  {
    id: 'movement',
    keywords: ['exercise', 'workout', 'gym', 'run', 'walk', 'training', 'movement', 'fitness', 'steps'],
    good: { name: '20-minute walk', type: 'good', icon: 'footprints', color: '#22c55e', weight: 6 },
    bad: { name: 'No movement breaks', type: 'bad', icon: 'monitor', color: '#ef4444', weight: 5 },
    reason: 'Small daily movement beats all-or-nothing workouts.',
  },
  {
    id: 'focus',
    keywords: ['focus', 'distract', 'work', 'scroll', 'screen', 'phone', 'doom', 'social', 'procrastinate'],
    good: { name: 'One deep work block', type: 'good', icon: 'brain', color: '#3b82f6', weight: 6 },
    bad: { name: 'Doomscrolling', type: 'bad', icon: 'phone', color: '#ef4444', weight: 6 },
    reason: 'Reducing distraction makes good habits easier to sustain.',
  },
  {
    id: 'stress',
    keywords: ['stress', 'anxious', 'anxiety', 'overwhelmed', 'calm', 'mood', 'sad', 'panic'],
    good: { name: '10-minute breathing', type: 'good', icon: 'smile', color: '#22c55e', weight: 5 },
    bad: { name: 'Spiral thinking', type: 'bad', icon: 'frown', color: '#ef4444', weight: 5 },
    reason: 'Short calming rituals reduce stress and improve consistency.',
  },
  {
    id: 'nutrition',
    keywords: ['diet', 'eat', 'food', 'junk', 'sugar', 'snack', 'fast', 'cravings', 'binge'],
    good: { name: 'Balanced meal', type: 'good', icon: 'utensils', color: '#f59e0b', weight: 6 },
    bad: { name: 'Late-night snacking', type: 'bad', icon: 'utensils', color: '#ef4444', weight: 5 },
    reason: 'Stable meals reduce energy crashes and cravings.',
  },
  {
    id: 'hydration',
    keywords: ['water', 'hydrate', 'hydration', 'thirst'],
    good: { name: '2L water', type: 'good', icon: 'droplets', color: '#22c55e', weight: 4 },
    bad: { name: 'Skipping water', type: 'bad', icon: 'droplets', color: '#ef4444', weight: 4 },
    reason: 'Hydration supports focus and energy with minimal effort.',
  },
  {
    id: 'alcohol',
    keywords: ['alcohol', 'beer', 'drink', 'drinking', 'hangover'],
    good: { name: 'Alcohol-free day', type: 'good', icon: 'beer', color: '#22c55e', weight: 6 },
    bad: { name: 'Drinking on weekdays', type: 'bad', icon: 'beer', color: '#ef4444', weight: 6 },
    reason: 'Reducing alcohol improves sleep and recovery quickly.',
  },
  {
    id: 'smoking',
    keywords: ['smoke', 'smoking', 'cigarette', 'nicotine', 'vape'],
    good: { name: 'Nicotine-free day', type: 'good', icon: 'heart', color: '#22c55e', weight: 7 },
    bad: { name: 'Smoking break', type: 'bad', icon: 'cigarette', color: '#ef4444', weight: 7 },
    reason: 'Reducing nicotine is high impact even with small wins.',
  },
  {
    id: 'screens',
    keywords: ['screen', 'phone', 'scroll', 'doom', 'tiktok', 'instagram', 'social', 'youtube'],
    good: { name: 'No-phone morning', type: 'good', icon: 'eye-off', color: '#3b82f6', weight: 6 },
    bad: { name: 'Endless scrolling', type: 'bad', icon: 'phone', color: '#ef4444', weight: 6 },
    reason: 'Protecting mornings from screens raises focus and calm.',
  },
  {
    id: 'mood',
    keywords: ['mood', 'down', 'sad', 'low', 'irritable', 'angry'],
    good: { name: 'Gratitude note', type: 'good', icon: 'heart', color: '#22c55e', weight: 4 },
    bad: { name: 'Negative rumination', type: 'bad', icon: 'frown', color: '#ef4444', weight: 4 },
    reason: 'Tiny emotional habits compound quickly.',
  },
];

function buildSuggestionPacks(text: string): SuggestionPack[] {
  const normalized = text.toLowerCase();
  const scored = CATEGORIES.map((c) => {
    const score = c.keywords.reduce((sum, k) => (normalized.includes(k) ? sum + 1 : sum), 0);
    return { ...c, score };
  }).sort((a, b) => b.score - a.score);

  if (!text.trim() || scored[0].score === 0) {
    const alternate = CATEGORIES.find(c => c.id !== 'sleep') ?? CATEGORIES[0];
    return [
      DEFAULT_SUGGESTION,
      {
        good: alternate.good,
        bad: alternate.bad,
        reason: alternate.reason,
      },
    ];
  }

  const top = scored[0];
  const second = scored.find((c) => c.id !== top.id) ?? scored[0];

  return [
    { good: top.good, bad: top.bad, reason: top.reason },
    { good: second.good, bad: second.bad, reason: second.reason },
  ];
}

export function AIOnboardingModal({ open, username, onComplete }: AIOnboardingModalProps) {
  const habits = useLifeflowStore((s) => s.habits);
  const addHabit = useLifeflowStore((s) => s.addHabit);

  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionPack[] | null>(null);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [touched, setTouched] = useState(false);

  const habitNames = useMemo(
    () => new Set(Object.values(habits).filter(h => h.active).map(h => h.name.toLowerCase())),
    [habits]
  );

  if (!open) return null;

  const applySuggestions = () => {
    setTouched(true);
    const packs = buildSuggestionPacks(input);
    setSuggestionIndex(0);
    setSuggestions(packs);
  };

  const canAdd = (name: string) => !habitNames.has(name.toLowerCase());

  const handleAdd = (habit: HabitSuggestion) => {
    if (!canAdd(habit.name)) return;
    addHabit({
      name: habit.name,
      type: habit.type,
      weight: habit.weight,
      icon: habit.icon,
      color: habit.color,
    });
  };

  const activeSuggestion = suggestions?.[suggestionIndex] ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-white/[0.08] flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[12px] text-gray-400 dark:text-white/40 uppercase tracking-wider">AI Onboarding</p>
            <p className="text-[16px] font-semibold">Hey {username}, let me get to know you.</p>
          </div>
          <button
            onClick={onComplete}
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-[13px] text-gray-500 dark:text-white/60 mb-2">
              Tell me what you want to improve, what drains you, or what feels off lately.
            </p>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: I feel tired most days, stay up too late, and I want better focus at work."
              className="w-full min-h-[96px] rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] px-4 py-3 text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 outline-none focus:border-emerald-400/60"
            />
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-400 dark:text-white/35">
              {['Sleep', 'Energy', 'Stress', 'Focus', 'Diet', 'Movement'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setInput(prev => `${prev ? `${prev} ` : ''}${chip.toLowerCase()}`)}
                  className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] hover:border-emerald-400/40 hover:text-emerald-500 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={applySuggestions}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-semibold transition-colors"
            >
              Get suggestions
            </button>
            {suggestions && suggestions.length > 1 && (
              <button
                onClick={() => setSuggestionIndex((prev) => (prev + 1) % suggestions.length)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] text-[13px] font-semibold text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Try another
              </button>
            )}
            <p className="text-[11px] text-gray-400 dark:text-white/35">
              Suggestions are based on your input. You can edit habits later.
            </p>
          </div>

          {activeSuggestion && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-[12px] text-emerald-600 dark:text-emerald-400">
                {activeSuggestion.reason}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([activeSuggestion.good, activeSuggestion.bad] as HabitSuggestion[]).map((habit) => {
                  const exists = !canAdd(habit.name);
                  return (
                    <div key={habit.name} className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${habit.color}22` }}>
                          <HabitIcon icon={habit.icon} size={18} className="text-gray-700 dark:text-white/80" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-semibold">{habit.name}</p>
                          <p className="text-[11px] text-gray-400 dark:text-white/35">
                            {habit.type === 'good' ? 'Good habit to build' : 'Bad habit to avoid'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAdd(habit)}
                          disabled={exists}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                            exists
                              ? 'bg-emerald-500/15 text-emerald-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {exists ? (
                            <span className="inline-flex items-center gap-1">
                              <Check size={12} /> Added
                            </span>
                          ) : 'Add'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!suggestions && touched && (
            <p className="text-[12px] text-gray-400 dark:text-white/35">
              Try a few more details and run it again for a better match.
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-white/[0.08] flex items-center justify-between">
          <p className="text-[11px] text-gray-400 dark:text-white/35">
            Consistency is behavior. Wellbeing is experience.
          </p>
          <button
            onClick={onComplete}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}
