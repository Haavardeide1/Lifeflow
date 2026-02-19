import Dexie, { type Table } from 'dexie';
import type { Habit, DailyEntry, DateKey, Wish, HistoryEntry } from '@/types';

export interface StoredState {
  id: string;
  userId?: string;
  habits: Record<string, Habit>;
  wishes: Record<string, Wish>;
  entries: Record<DateKey, DailyEntry>;
  history?: HistoryEntry[];
  historyIndex?: number;
  updatedAt: number;
}

class LifeflowDatabase extends Dexie {
  state!: Table<StoredState, string>;

  constructor() {
    super('LifeflowDB');
    this.version(1).stores({
      state: 'id',
    });
  }
}

export const db = new LifeflowDatabase();

const AUTO_SAVE_ID = 'auto-save';

function getAutoSaveId(userId?: string): string {
  if (!userId) return AUTO_SAVE_ID;
  return `${AUTO_SAVE_ID}:${userId}`;
}

export async function autoSave(
  habits: Record<string, Habit>,
  wishes: Record<string, Wish>,
  entries: Record<DateKey, DailyEntry>,
  userId?: string,
  history?: HistoryEntry[],
  historyIndex?: number
): Promise<void> {
  await db.state.put({
    id: getAutoSaveId(userId),
    userId,
    habits,
    wishes,
    entries,
    history,
    historyIndex,
    updatedAt: Date.now(),
  });
}

export async function loadAutoSave(userId?: string): Promise<StoredState | undefined> {
  if (userId) {
    return await db.state.get(getAutoSaveId(userId));
  }
  return await db.state.get(AUTO_SAVE_ID);
}

export async function clearAutoSave(userId?: string): Promise<void> {
  if (userId) {
    await db.state.delete(getAutoSaveId(userId));
    return;
  }
  await db.state.delete(AUTO_SAVE_ID);
}
