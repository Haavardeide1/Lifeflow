'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import { useAuthStore } from '@/stores/authStore';
import { autoSave, loadAutoSave } from '@/lib/database';
import { loadUserData, upsertHabit, upsertEntry } from '@/lib/supabaseSync';

const SYNC_DELAY = 2000;

export function usePersistence() {
  const habits = useLifeflowStore((s) => s.habits);
  const entries = useLifeflowStore((s) => s.entries);
  const loadData = useLifeflowStore((s) => s.loadData);
  const user = useAuthStore((s) => s.user);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  const lastSaveRef = useRef<string>('');
  const prevHabitsRef = useRef<typeof habits>({});
  const prevEntriesRef = useRef<typeof entries>({});

  // Load data: from Supabase if logged in, fallback to IndexedDB
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const load = async () => {
      try {
        if (user) {
          // Load from Supabase
          const data = await loadUserData(user.id);
          if (data.habits.length > 0 || data.entries.length > 0) {
            loadData(data.habits, data.entries);
            // Also cache locally
            const habitsRecord: Record<string, typeof data.habits[0]> = {};
            data.habits.forEach(h => habitsRecord[h.id] = h);
            const entriesRecord: Record<string, typeof data.entries[0]> = {};
            data.entries.forEach(e => entriesRecord[e.date] = e);
            await autoSave(habitsRecord, entriesRecord);
          }
          hasLoadedRef.current = true;
        } else {
          // Fallback to IndexedDB for offline/not-logged-in
          const saved = await loadAutoSave();
          if (saved) {
            const habitArray = Object.values(saved.habits);
            const entryArray = Object.values(saved.entries);
            if (habitArray.length > 0 || entryArray.length > 0) {
              loadData(habitArray, entryArray);
            }
          }
          hasLoadedRef.current = true;
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback to IndexedDB on Supabase failure
        const saved = await loadAutoSave();
        if (saved) {
          loadData(Object.values(saved.habits), Object.values(saved.entries));
        }
        hasLoadedRef.current = true;
      }
    };

    load();
  }, [user, loadData]);

  // Auto-save: to IndexedDB always, to Supabase if logged in
  useEffect(() => {
    const stateHash = JSON.stringify({
      habitCount: Object.keys(habits).length,
      entryCount: Object.keys(entries).length,
      lastUpdate: Math.max(
        ...Object.values(habits).map(h => h.updatedAt).concat(
          Object.values(entries).map(e => e.updatedAt)
        ).concat([0])
      ),
    });

    if (stateHash === lastSaveRef.current) return;
    if (Object.keys(habits).length === 0 && Object.keys(entries).length === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Always save to IndexedDB (fast, offline)
        await autoSave(habits, entries);
        lastSaveRef.current = stateHash;

        // Sync changed items to Supabase if logged in
        if (user) {
          // Find changed habits
          for (const [id, habit] of Object.entries(habits)) {
            const prev = prevHabitsRef.current[id];
            if (!prev || prev.updatedAt !== habit.updatedAt) {
              try {
                await upsertHabit(user.id, habit);
              } catch (e) {
                console.error('Failed to sync habit:', e);
              }
            }
          }

          // Find changed entries
          for (const [date, entry] of Object.entries(entries)) {
            const prev = prevEntriesRef.current[date];
            if (!prev || prev.updatedAt !== entry.updatedAt) {
              try {
                await upsertEntry(user.id, entry);
              } catch (e) {
                console.error('Failed to sync entry:', e);
              }
            }
          }
        }

        prevHabitsRef.current = { ...habits };
        prevEntriesRef.current = { ...entries };
      } catch (error) {
        console.error('Failed to save:', error);
      }
    }, SYNC_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [habits, entries, user]);

  const save = useCallback(async () => {
    try {
      await autoSave(habits, entries);
    } catch (error) {
      console.error('Failed to save:', error);
      throw error;
    }
  }, [habits, entries]);

  return { save };
}
