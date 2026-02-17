'use client';

import { useState } from 'react';
import type { Habit, HabitType } from '@/types';
import { HabitIcon, AVAILABLE_ICONS } from '@/components/shared/HabitIcon';
import { X } from 'lucide-react';

const PRESET_COLORS = [
  '#22c55e', '#3b82f6', '#a855f7', '#06b6d4',
  '#14b8a6', '#f97316', '#ef4444', '#eab308',
  '#ec4899', '#6366f1',
];

interface HabitFormProps {
  habit?: Habit;
  onSave: (data: { name: string; type: HabitType; weight: number; icon: string; color: string }) => void;
  onCancel: () => void;
}

export function HabitForm({ habit, onSave, onCancel }: HabitFormProps) {
  const [name, setName] = useState(habit?.name ?? '');
  const [type, setType] = useState<HabitType>(habit?.type ?? 'good');
  const [weight, setWeight] = useState(habit?.weight ?? 5);
  const [icon, setIcon] = useState(habit?.icon ?? 'heart');
  const [color, setColor] = useState(habit?.color ?? '#22c55e');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), type, weight, icon, color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#1c1c24] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-[15px] font-semibold">{habit ? 'Edit Habit' : 'Add Habit'}</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="text-[12px] font-medium text-white/50 uppercase tracking-wider">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Went for a run"
              className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-colors"
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-[12px] font-medium text-white/50 uppercase tracking-wider">Type</label>
            <div className="mt-1.5 flex gap-2">
              <button
                onClick={() => setType('good')}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  type === 'good'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.06]'
                }`}
              >
                Good Habit
              </button>
              <button
                onClick={() => setType('bad')}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  type === 'bad'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.06]'
                }`}
              >
                Bad Habit
              </button>
            </div>
          </div>

          {/* Weight */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-white/50 uppercase tracking-wider">
                Impact Weight
              </label>
              <span className="text-[14px] font-bold" style={{ color }}>
                {weight}/10
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="mt-2 w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${color} 0%, ${color} ${((weight - 1) / 9) * 100}%, #374151 ${((weight - 1) / 9) * 100}%, #374151 100%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-white/30">Minor</span>
              <span className="text-[10px] text-white/30">Life-changing</span>
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="text-[12px] font-medium text-white/50 uppercase tracking-wider">Icon</label>
            <div className="mt-2 grid grid-cols-9 gap-1.5">
              {AVAILABLE_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  onClick={() => setIcon(iconName)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    icon === iconName
                      ? 'bg-white/20 text-white'
                      : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'
                  }`}
                >
                  <HabitIcon icon={iconName} size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-[12px] font-medium text-white/50 uppercase tracking-wider">Color</label>
            <div className="mt-2 flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1c1c24]' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg text-[13px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {habit ? 'Save Changes' : 'Add Habit'}
          </button>
        </div>
      </div>
    </div>
  );
}
