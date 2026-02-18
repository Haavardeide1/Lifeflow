'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import { useAuthStore } from '@/stores/authStore';
import { autoSave, loadAutoSave } from '@/lib/database';
import { loadUserData, upsertHabit, upsertEntry, upsertProfile, upsertWishes, deleteWishesCloud } from '@/lib/supabaseSync';
import { calculateAllStreaks } from '@/lib/streaks';

const SYNC_DELAY = 2000;

export function usePersistence() {
  const habits = useLifeflowStore((s) => s.habits);
  const wishes = useLifeflowStore((s) => s.wishes);
  const entries = useLifeflowStore((s) => s.entries);
  const loadData = useLifeflowStore((s) => s.loadData);
  const user = useAuthStore((s) => s.user);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  const lastSaveRef = useRef<string>('');
  const prevHabitsRef = useRef<typeof habits>({});
  const prevWishesRef = useRef<typeof wishes>({});
  const prevEntriesRef = useRef<typeof entries>({});

  // Load data: from Supabase if logged in, fallback to IndexedDB
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const load = async () => {
      try {
        const saved = await loadAutoSave(user?.id);
        const savedHabits = saved ? Object.values(saved.habits) : [];
        const savedEntries = saved ? Object.values(saved.entries) : [];
        const savedWishes = saved?.wishes ? Object.values(saved.wishes) : [];

        if (user) {
          // Load from Supabase
          const data = await loadUserData(user.id);
          if (data.habits.length > 0 || data.entries.length > 0 || data.wishes.length > 0) {
            const wishesToUse = data.wishes.length > 0 ? data.wishes : savedWishes;
            loadData(data.habits, data.entries, wishesToUse);
            // Also cache locally
            const habitsRecord: Record<string, typeof data.habits[0]> = {};
            data.habits.forEach(h => habitsRecord[h.id] = h);
            const entriesRecord: Record<string, typeof data.entries[0]> = {};
            data.entries.forEach(e => entriesRecord[e.date] = e);
            const wishesRecord: Record<string, typeof wishesToUse[0]> = {};
            wishesToUse.forEach(w => wishesRecord[w.id] = w);
            await autoSave(habitsRecord, wishesRecord, entriesRecord, user.id);
            hasLoadedRef.current = true;
            return;
          }

          // If Supabase is empty, fallback to local cache to avoid "lost" data
          if (saved) {
            if (savedHabits.length > 0 || savedEntries.length > 0 || savedWishes.length > 0) {
              loadData(savedHabits, savedEntries, savedWishes);
            }
          }

          hasLoadedRef.current = true;
        } else {
          // Fallback to IndexedDB for offline/not-logged-in
          if (saved) {
            if (savedHabits.length > 0 || savedEntries.length > 0 || savedWishes.length > 0) {
              loadData(savedHabits, savedEntries, savedWishes);
            }
          }
          hasLoadedRef.current = true;
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback to IndexedDB on Supabase failure
        const saved = await loadAutoSave(user?.id);
        if (saved) {
          loadData(
            Object.values(saved.habits),
            Object.values(saved.entries),
            saved.wishes ? Object.values(saved.wishes) : []
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
        await autoSave(habits, wishes, entries, user?.id);
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
  }, [habits, wishes, entries, user]);

  const save = useCallback(async () => {
    try {
        await autoSave(habits, wishes, entries, user?.id);
      } catch (error) {
        console.error('Failed to save:', error);
        throw error;
      }
  }, [habits, wishes, entries, user?.id]);

  return { save };
}
