'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import { useAuthStore } from '@/stores/authStore';
import { autoSave, loadAutoSave } from '@/lib/database';
import { loadUserData, upsertHabit, upsertEntry, upsertProfile, upsertWishes, deleteWishesCloud } from '@/lib/supabaseSync';
import { calculateAllStreaks } from '@/lib/streaks';

const SYNC_DELAY = 2000;
const PERSIST_HISTORY = true;

function latestUpdatedAt<T extends { updatedAt: number }>(items: T[]): number {
  return items.reduce((max, item) => Math.max(max, item.updatedAt || 0), 0);
}

function mergeByUpdatedAt<T extends { updatedAt: number }>(
  localItems: T[],
  cloudItems: T[],
  keyFn: (item: T) => string
): T[] {
  const merged = new Map<string, T>();
  for (const item of cloudItems) merged.set(keyFn(item), item);
  for (const item of localItems) {
    const key = keyFn(item);
    const existing = merged.get(key);
    if (!existing || item.updatedAt > existing.updatedAt) {
      merged.set(key, item);
    }
  }
  return Array.from(merged.values());
}

export function usePersistence() {
  const habits = useLifeflowStore((s) => s.habits);
  const wishes = useLifeflowStore((s) => s.wishes);
  const entries = useLifeflowStore((s) => s.entries);
  const history = useLifeflowStore((s) => s.history);
  const historyIndex = useLifeflowStore((s) => s.historyIndex);
  const loadData = useLifeflowStore((s) => s.loadData);
  const user = useAuthStore((s) => s.user);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  const lastSaveRef = useRef<string>('');
  const prevHabitsRef = useRef<typeof habits>({});
  const prevWishesRef = useRef<typeof wishes>({});
  const prevEntriesRef = useRef<typeof entries>({});
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (prevUserIdRef.current !== currentUserId) {
      prevUserIdRef.current = currentUserId;
      hasLoadedRef.current = false;
      lastSaveRef.current = '';
      prevHabitsRef.current = {};
      prevWishesRef.current = {};
      prevEntriesRef.current = {};
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      loadData([], [], [], { history: [], historyIndex: -1 });
    }
  }, [user?.id, loadData]);

  // Load data: from Supabase if logged in, fallback to IndexedDB
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const load = async () => {
      try {
        const saved = await loadAutoSave(user?.id);
        const savedHabits = saved ? Object.values(saved.habits) : [];
        const savedEntries = saved ? Object.values(saved.entries) : [];
        const savedWishes = saved?.wishes ? Object.values(saved.wishes) : [];
        const savedHistory = saved?.history ?? [];
        const savedHistoryIndex = saved?.historyIndex ?? -1;

        if (user) {
          const data = await loadUserData(user.id);
          const hasCloudData = data.habits.length > 0 || data.entries.length > 0 || data.wishes.length > 0;

          if (hasCloudData || saved) {
            const mergedHabits = mergeByUpdatedAt(savedHabits, data.habits, (h) => h.id);
            const mergedEntries = mergeByUpdatedAt(savedEntries, data.entries, (e) => e.date);
            const mergedWishes = mergeByUpdatedAt(savedWishes, data.wishes, (w) => w.id);

            const localUpdatedAt = Math.max(
              latestUpdatedAt(savedHabits),
              latestUpdatedAt(savedEntries),
              latestUpdatedAt(savedWishes)
            );
            const cloudUpdatedAt = Math.max(
              latestUpdatedAt(data.habits),
              latestUpdatedAt(data.entries),
              latestUpdatedAt(data.wishes)
            );
            const restoreHistory = PERSIST_HISTORY && savedHistory.length > 0 && localUpdatedAt >= cloudUpdatedAt;

            loadData(mergedHabits, mergedEntries, mergedWishes, {
              history: restoreHistory ? savedHistory : [],
              historyIndex: restoreHistory ? savedHistoryIndex : -1,
            });

            const habitsRecord: Record<string, typeof mergedHabits[0]> = {};
            mergedHabits.forEach(h => habitsRecord[h.id] = h);
            const entriesRecord: Record<string, typeof mergedEntries[0]> = {};
            mergedEntries.forEach(e => entriesRecord[e.date] = e);
            const wishesRecord: Record<string, typeof mergedWishes[0]> = {};
            mergedWishes.forEach(w => wishesRecord[w.id] = w);

            await autoSave(
              habitsRecord,
              wishesRecord,
              entriesRecord,
              user.id,
              restoreHistory ? savedHistory : undefined,
              restoreHistory ? savedHistoryIndex : undefined
            );

            hasLoadedRef.current = true;
            return;
          }

          hasLoadedRef.current = true;
          return;
        }

        if (saved && (savedHabits.length > 0 || savedEntries.length > 0 || savedWishes.length > 0)) {
          const restoreHistory = PERSIST_HISTORY && savedHistory.length > 0;
          loadData(savedHabits, savedEntries, savedWishes, {
            history: restoreHistory ? savedHistory : [],
            historyIndex: restoreHistory ? savedHistoryIndex : -1,
          });
        }

        hasLoadedRef.current = true;
      } catch (error) {
        console.error('Failed to load data:', error);
        const saved = await loadAutoSave(user?.id);
        if (saved) {
          const restoreHistory = PERSIST_HISTORY && (saved.history?.length || 0) > 0;
          loadData(
            Object.values(saved.habits),
            Object.values(saved.entries),
            saved.wishes ? Object.values(saved.wishes) : [],
            {
              history: restoreHistory ? saved.history : [],
              historyIndex: restoreHistory ? saved.historyIndex ?? -1 : -1,
            }
          );
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
      wishCount: Object.keys(wishes).length,
      entryCount: Object.keys(entries).length,
      lastUpdate: Math.max(
        ...Object.values(habits).map(h => h.updatedAt).concat(
          Object.values(wishes).map(w => w.updatedAt)
        ).concat(
          Object.values(entries).map(e => e.updatedAt)
        ).concat([0])
      ),
    });

    if (stateHash === lastSaveRef.current) return;
    if (Object.keys(habits).length === 0 && Object.keys(entries).length === 0 && Object.keys(wishes).length === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Always save to IndexedDB (fast, offline)
        await autoSave(
          habits,
          wishes,
          entries,
          user?.id,
          PERSIST_HISTORY ? history : undefined,
          PERSIST_HISTORY ? historyIndex : undefined
        );
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

          // Sync wishes
          const wishIds = new Set(Object.keys(wishes));
          const changedWishes = Object.values(wishes).filter((wish) => {
            const prev = prevWishesRef.current[wish.id];
            return !prev || prev.updatedAt !== wish.updatedAt;
          });
          const removedWishIds = Object.keys(prevWishesRef.current).filter((id) => !wishIds.has(id));

          if (changedWishes.length > 0) {
            try {
              await upsertWishes(user.id, changedWishes);
            } catch (e) {
              console.error('Failed to sync wishes:', e);
            }
          }
          if (removedWishIds.length > 0) {
            try {
              await deleteWishesCloud(removedWishIds);
            } catch (e) {
              console.error('Failed to delete wishes:', e);
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

          // Update streak count on profile
          try {
            const allStreaks = calculateAllStreaks(habits, entries);
            const maxStreak = Math.max(0, ...allStreaks.map(s => s.currentStreak));
            await upsertProfile(user.id, { currentStreakDays: maxStreak });
          } catch {
            // Non-critical, ignore
          }
        }

        prevHabitsRef.current = { ...habits };
        prevWishesRef.current = { ...wishes };
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
  }, [habits, wishes, entries, user, history, historyIndex]);

  const save = useCallback(async () => {
    try {
        await autoSave(
          habits,
          wishes,
          entries,
          user?.id,
          PERSIST_HISTORY ? history : undefined,
          PERSIST_HISTORY ? historyIndex : undefined
        );
      } catch (error) {
        console.error('Failed to save:', error);
        throw error;
      }
  }, [habits, wishes, entries, user?.id, history, historyIndex]);

  return { save };
}
