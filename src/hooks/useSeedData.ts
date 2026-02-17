'use client';

import { useEffect, useRef } from 'react';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import { DEFAULT_HABITS } from '@/lib/seedData';

export function useSeedData() {
  const addHabit = useLifeflowStore((s) => s.addHabit);
  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (hasSeededRef.current) return;

    // Wait a tick for persistence to load first
    const timer = setTimeout(() => {
      if (Object.keys(useLifeflowStore.getState().habits).length === 0) {
        hasSeededRef.current = true;
        DEFAULT_HABITS.forEach(h => addHabit(h));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [addHabit]);
}
