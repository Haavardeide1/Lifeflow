'use client';

import { useEffect } from 'react';
import { Mountain } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ThemeProvider } from './ThemeProvider';
import { usePersistence } from '@/hooks/usePersistence';
import { useAuthStore } from '@/stores/authStore';
import { AuthScreen } from '@/components/auth/AuthScreen';

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  usePersistence();

  if (loading) {
    return (
      <>
        <ThemeProvider />
        <div className="flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <Mountain size={24} className="text-white" />
            </div>
            <p className="text-[13px] text-gray-400 dark:text-white/40">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <ThemeProvider />
        <AuthScreen />
      </>
    );
  }

  return (
    <>
      <ThemeProvider />
      <div className="flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </>
  );
}
