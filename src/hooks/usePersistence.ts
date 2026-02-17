'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import { autoSave, loadAutoSave } from '@/lib/database';

const AUTO_SAVE_DELAY = 2000;

export function usePersistence() {
  const habits = useLifeflowStore((s) => s.habits);
  const entries = useLifeflowStore((s) => s.entries);
  const loadData = useLifeflowStore((s) => s.loadData);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  const lastSaveRef = useRef<string>('');

  // Load saved data on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const load = async () => {
      try {
        const saved = await loadAutoSave();
        if (saved) {
          const habitArray = Object.values(saved.habits);
          const entryArray = Object.values(saved.entries);
          if (habitArray.length > 0 || entryArray.length > 0) {
            loadData(habitArray, entryArray);
          }
        }
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    };

    load();
  }, [loadData]);

  // Auto-save when data changes
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
        await autoSave(habits, entries);
        lastSaveRef.current = stateHash;
      } catch (error) {
        console.error('Failed to auto-save:', error);
      }
    }, AUTO_SAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [habits, entries]);

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
