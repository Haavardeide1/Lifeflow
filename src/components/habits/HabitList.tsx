'use client';

import { useState } from 'react';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import type { Habit } from '@/types';
import { HabitIcon } from '@/components/shared/HabitIcon';
import { HabitForm } from './HabitForm';
import { Card } from '@/components/shared/Card';
import { Plus, Pencil, Archive, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';

export function HabitList() {
  const habits = useLifeflowStore((s) => s.habits);
  const addHabit = useLifeflowStore((s) => s.addHabit);
  const updateHabit = useLifeflowStore((s) => s.updateHabit);
  const deleteHabit = useLifeflowStore((s) => s.deleteHabit);

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeHabits = Object.values(habits)
    .filter(h => h.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const archivedHabits = Object.values(habits).filter(h => !h.active);
  const goodHabits = activeHabits.filter(h => h.type === 'good');
  const badHabits = activeHabits.filter(h => h.type === 'bad');

  const handleAddHabit = (data: { name: string; type: 'good' | 'bad'; weight: number; icon: string; color: string }) => {
    addHabit(data);
    setShowForm(false);
  };

  const handleEditHabit = (data: { name: string; type: 'good' | 'bad'; weight: number; icon: string; color: string }) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, data);
      setEditingHabit(null);
    }
  };

  const handleRestore = (id: string) => {
    updateHabit(id, { active: true });
  };

  const renderHabitRow = (habit: Habit) => (
    <div
      key={habit.id}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${habit.color}20` }}
      >
        <HabitIcon icon={habit.icon} size={16} className="text-white/70" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-white/90 truncate">{habit.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
            habit.type === 'good'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {habit.type}
          </span>
          <span className="text-[11px] text-white/30">
            weight: {habit.weight}/10
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Weight bar */}
        <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden mr-2">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(habit.weight / 10) * 100}%`,
              backgroundColor: habit.color,
            }}
          />
        </div>

        <button
          onClick={() => setEditingHabit(habit)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => deleteHabit(habit.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Archive"
        >
          <Archive size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold">Habits</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[13px] font-medium text-white transition-colors"
          >
            <Plus size={16} />
            Add Habit
          </button>
        </div>

        {/* Good Habits */}
        {goodHabits.length > 0 && (
          <Card title={`Good Habits (${goodHabits.length})`}>
            <div className="divide-y divide-white/[0.04]">
              {goodHabits.map(renderHabitRow)}
            </div>
          </Card>
        )}

        {/* Bad Habits */}
        {badHabits.length > 0 && (
          <Card title={`Bad Habits (${badHabits.length})`}>
            <div className="divide-y divide-white/[0.04]">
              {badHabits.map(renderHabitRow)}
            </div>
          </Card>
        )}

        {/* Archived */}
        {archivedHabits.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/60 transition-colors"
            >
              {showArchived ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Archived ({archivedHabits.length})
            </button>
            {showArchived && (
              <Card className="mt-3">
                <div className="divide-y divide-white/[0.04]">
                  {archivedHabits.map(habit => (
                    <div key={habit.id} className="flex items-center gap-3 px-4 py-3 opacity-50">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center">
                        <HabitIcon icon={habit.icon} size={16} className="text-white/40" />
                      </div>
                      <span className="flex-1 text-[14px] text-white/50">{habit.name}</span>
                      <button
                        onClick={() => handleRestore(habit.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <RotateCcw size={12} />
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <HabitForm onSave={handleAddHabit} onCancel={() => setShowForm(false)} />
      )}
      {editingHabit && (
        <HabitForm
          habit={editingHabit}
          onSave={handleEditHabit}
          onCancel={() => setEditingHabit(null)}
        />
      )}
    </div>
  );
}
