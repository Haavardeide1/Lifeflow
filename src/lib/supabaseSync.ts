import { supabase } from './supabase';
import type { Habit, DailyEntry, DateKey } from '@/types';

// ============================================================
// LOAD all data for the current user
// ============================================================

export async function loadUserData(userId: string): Promise<{
  habits: Habit[];
  entries: DailyEntry[];
}> {
  // Load habits
  const { data: habitsData, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order');

  if (habitsError) throw habitsError;

  const habits: Habit[] = (habitsData || []).map((h) => ({
    id: h.id,
    name: h.name,
    type: h.type as 'good' | 'bad',
    weight: h.weight,
    icon: h.icon,
    color: h.color,
    sortOrder: h.sort_order,
    active: h.active,
    createdAt: new Date(h.created_at).getTime(),
    updatedAt: new Date(h.updated_at).getTime(),
  }));

  // Load entries with completions
  const { data: entriesData, error: entriesError } = await supabase
    .from('entries')
    .select(`
      *,
      habit_completions (habit_id, completed)
    `)
    .eq('user_id', userId)
    .order('date');

  if (entriesError) throw entriesError;

  const entries: DailyEntry[] = (entriesData || []).map((e) => ({
    date: e.date as DateKey,
    mood: e.mood,
    energy: e.energy,
    sleep: e.sleep,
    healthScore: Number(e.health_score),
    notes: e.notes,
    habitCompletions: (e.habit_completions || []).map((hc: { habit_id: string; completed: boolean }) => ({
      habitId: hc.habit_id,
      completed: hc.completed,
    })),
    createdAt: new Date(e.created_at).getTime(),
    updatedAt: new Date(e.updated_at).getTime(),
  }));

  return { habits, entries };
}

// ============================================================
// HABITS
// ============================================================

export async function upsertHabit(userId: string, habit: Habit): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .upsert({
      id: habit.id,
      user_id: userId,
      name: habit.name,
      type: habit.type,
      weight: habit.weight,
      icon: habit.icon,
      color: habit.color,
      sort_order: habit.sortOrder,
      active: habit.active,
      created_at: new Date(habit.createdAt).toISOString(),
      updated_at: new Date(habit.updatedAt).toISOString(),
    }, { onConflict: 'id' });

  if (error) throw error;
}

export async function deleteHabitCloud(habitId: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId);

  if (error) throw error;
}

// ============================================================
// ENTRIES
// ============================================================

export async function upsertEntry(
  userId: string,
  entry: DailyEntry
): Promise<void> {
  // Upsert the entry
  const { data, error } = await supabase
    .from('entries')
    .upsert({
      user_id: userId,
      date: entry.date,
      mood: entry.mood,
      energy: entry.energy,
      sleep: entry.sleep,
      health_score: entry.healthScore,
      notes: entry.notes,
      updated_at: new Date(entry.updatedAt).toISOString(),
    }, { onConflict: 'user_id,date' })
    .select('id')
    .single();

  if (error) throw error;

  const entryId = data.id;

  // Delete existing completions for this entry
  await supabase
    .from('habit_completions')
    .delete()
    .eq('entry_id', entryId);

  // Insert new completions
  if (entry.habitCompletions.length > 0) {
    const completions = entry.habitCompletions.map((hc) => ({
      entry_id: entryId,
      habit_id: hc.habitId,
      completed: hc.completed,
    }));

    const { error: compError } = await supabase
      .from('habit_completions')
      .insert(completions);

    if (compError) throw compError;
  }
}

export async function deleteEntryCloud(userId: string, date: DateKey): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('user_id', userId)
    .eq('date', date);

  if (error) throw error;
}
