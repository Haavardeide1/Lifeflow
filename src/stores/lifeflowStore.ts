import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  Habit,
  HabitType,
  DailyEntry,
  DateKey,
  HabitCompletion,
  LifeflowSnapshot,
  HistoryEntry,
} from '@/types';
import { calculateHealthScore } from '@/lib/scoring';

const MAX_HISTORY = 50;

interface LifeflowState {
  habits: Record<string, Habit>;
  entries: Record<DateKey, DailyEntry>;
  history: HistoryEntry[];
  historyIndex: number;

  // Habit CRUD
  addHabit: (params: {
    name: string;
    type: HabitType;
    weight: number;
    icon: string;
    color: string;
  }) => Habit;
  updateHabit: (id: string, updates: Partial<Omit<Habit, 'id'>>) => void;
  deleteHabit: (id: string) => void;
  reorderHabits: (orderedIds: string[]) => void;

  // Entry CRUD
  saveEntry: (params: {
    date: DateKey;
    mood: number;
    energy: number;
    sleep: number;
    habitCompletions: HabitCompletion[];
    notes: string;
  }) => DailyEntry;
  deleteEntry: (date: DateKey) => void;

  // Bulk
  loadData: (habits: Habit[], entries: DailyEntry[]) => void;
  clearAll: () => void;

  // When habit weights change, recalculate all health scores
  recalculateScores: () => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getSnapshot: () => LifeflowSnapshot;
}

function pushHistory(
  state: LifeflowState,
  description: string
): Pick<LifeflowState, 'history' | 'historyIndex'> {
  const snapshot = state.getSnapshot();
  return {
    history: [
      ...state.history.slice(0, state.historyIndex + 1),
      { id: uuid(), timestamp: Date.now(), description, snapshot },
    ].slice(-MAX_HISTORY),
    historyIndex: Math.min(state.historyIndex + 1, MAX_HISTORY - 1),
  };
}

export const useLifeflowStore = create<LifeflowState>((set, get) => ({
  habits: {},
  entries: {},
  history: [],
  historyIndex: -1,

  addHabit: ({ name, type, weight, icon, color }) => {
    const id = uuid();
    const now = Date.now();
    const sortOrder = Object.keys(get().habits).length + 1;
    const habit: Habit = {
      id, name, type, weight, icon, color, sortOrder,
      active: true, createdAt: now, updatedAt: now,
    };

    set((s) => ({
      habits: { ...s.habits, [id]: habit },
      ...pushHistory(s, `Add habit: ${name}`),
    }));

    return habit;
  },

  updateHabit: (id, updates) => {
    const habit = get().habits[id];
    if (!habit) return;

    set((s) => ({
      habits: {
        ...s.habits,
        [id]: { ...habit, ...updates, updatedAt: Date.now() },
      },
      ...pushHistory(s, `Update habit: ${habit.name}`),
    }));
  },

  deleteHabit: (id) => {
    const habit = get().habits[id];
    if (!habit) return;

    set((s) => ({
      habits: {
        ...s.habits,
        [id]: { ...habit, active: false, updatedAt: Date.now() },
      },
      ...pushHistory(s, `Archive habit: ${habit.name}`),
    }));
  },

  reorderHabits: (orderedIds) => {
    set((s) => {
      const habits = { ...s.habits };
      orderedIds.forEach((id, i) => {
        if (habits[id]) {
          habits[id] = { ...habits[id], sortOrder: i + 1 };
        }
      });
      return { habits, ...pushHistory(s, 'Reorder habits') };
    });
  },

  saveEntry: ({ date, mood, energy, sleep, habitCompletions, notes }) => {
    const now = Date.now();
    const existing = get().entries[date];
    const healthScore = calculateHealthScore(mood, energy, sleep, habitCompletions, get().habits);

    const entry: DailyEntry = {
      date, mood, energy, sleep, habitCompletions, notes, healthScore,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    set((s) => ({
      entries: { ...s.entries, [date]: entry },
      ...pushHistory(s, `${existing ? 'Update' : 'Save'} entry: ${date}`),
    }));

    return entry;
  },

  deleteEntry: (date) => {
    if (!get().entries[date]) return;

    set((s) => {
      const entries = { ...s.entries };
      delete entries[date];
      return { entries, ...pushHistory(s, `Delete entry: ${date}`) };
    });
  },

  loadData: (habits, entries) => {
    const habitsRecord: Record<string, Habit> = {};
    habits.forEach((h) => (habitsRecord[h.id] = h));

    const entriesRecord: Record<DateKey, DailyEntry> = {};
    entries.forEach((e) => (entriesRecord[e.date] = e));

    set({
      habits: habitsRecord,
      entries: entriesRecord,
    });
  },

  clearAll: () => {
    set((s) => ({
      habits: {},
      entries: {},
      ...pushHistory(s, 'Clear all data'),
    }));
  },

  recalculateScores: () => {
    const { habits, entries } = get();
    const updatedEntries = { ...entries };
    for (const date of Object.keys(updatedEntries)) {
      const e = updatedEntries[date];
      updatedEntries[date] = {
        ...e,
        healthScore: calculateHealthScore(e.mood, e.energy, e.sleep, e.habitCompletions, habits),
      };
    }
    set({ entries: updatedEntries });
  },

  undo: () => {
    const state = get();
    if (!state.canUndo()) return;
    const entry = state.history[state.historyIndex];
    set({
      habits: entry.snapshot.habits,
      entries: entry.snapshot.entries,
      historyIndex: state.historyIndex - 1,
    });
  },

  redo: () => {
    const state = get();
    if (!state.canRedo()) return;
    const nextEntry = state.history[state.historyIndex + 1];
    if (nextEntry) {
      set({
        habits: nextEntry.snapshot.habits,
        entries: nextEntry.snapshot.entries,
        historyIndex: state.historyIndex + 1,
      });
    }
  },

  canUndo: () => get().historyIndex >= 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  getSnapshot: () => ({
    habits: { ...get().habits },
    entries: { ...get().entries },
  }),
}));
