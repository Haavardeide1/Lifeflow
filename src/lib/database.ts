import Dexie, { type Table } from 'dexie';
import type { Habit, DailyEntry, DateKey, Wish } from '@/types';

export interface StoredState {
  id: string;
  habits: Record<string, Habit>;
  wishes: Record<string, Wish>;
  entries: Record<DateKey, DailyEntry>;
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

export async function autoSave(
  habits: Record<string, Habit>,
  wishes: Record<string, Wish>,
  entries: Record<DateKey, DailyEntry>
): Promise<void> {
  await db.state.put({
    id: AUTO_SAVE_ID,
    habits,
    wishes,
    entries,
    updatedAt: Date.now(),
  });
}

export async function loadAutoSave(): Promise<StoredState | undefined> {
  return await db.state.get(AUTO_SAVE_ID);
}

export async function clearAutoSave(): Promise<void> {
  await db.state.delete(AUTO_SAVE_ID);
}
