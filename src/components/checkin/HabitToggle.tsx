'use client';

import type { Habit } from '@/types';
import { HabitIcon } from '@/components/shared/HabitIcon';

interface HabitToggleProps {
  habit: Habit;
  completed: boolean;
  onToggle: () => void;
}

export function HabitToggle({ habit, completed, onToggle }: HabitToggleProps) {
  const isGood = habit.type === 'good';

  return (
    <button
      onClick={onToggle}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
        ${completed
          ? isGood
            ? 'bg-emerald-500/15 border border-emerald-500/30'
            : 'bg-red-500/15 border border-red-500/30'
          : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
        }
      `}
    >
      <div
        className={`
          w-8 h-8 rounded-lg flex items-center justify-center transition-colors
          ${completed
            ? isGood ? 'bg-emerald-500/20' : 'bg-red-500/20'
            : 'bg-white/[0.06]'
          }
        `}
      >
        <HabitIcon
          icon={habit.icon}
          size={16}
          className={completed
            ? isGood ? 'text-emerald-400' : 'text-red-400'
            : 'text-white/40'
          }
        />
      </div>

      <span className={`flex-1 text-left text-[14px] ${completed ? 'text-white' : 'text-white/60'}`}>
        {habit.name}
      </span>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-white/30 font-medium">
          {habit.weight}/10
        </span>
        <div
          className={`
            w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
            ${completed
              ? isGood
                ? 'bg-emerald-500 border-emerald-500'
                : 'bg-red-500 border-red-500'
              : 'border-white/20'
            }
          `}
        >
          {completed && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}
