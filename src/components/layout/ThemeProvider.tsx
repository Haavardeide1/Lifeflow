'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

export function ThemeProvider() {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return null;
}
