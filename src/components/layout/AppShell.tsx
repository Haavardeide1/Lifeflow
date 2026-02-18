'use client';

import { useEffect } from 'react';
import { Mountain } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ThemeProvider } from './ThemeProvider';
import { usePersistence } from '@/hooks/usePersistence';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { AuthScreen } from '@/components/auth/AuthScreen';

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const initialize = useAuthStore((s) => s.initialize);
  const profile = useProfileStore((s) => s.profile);

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
          <div className="shrink-0 border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-black/30 backdrop-blur">
            <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-semibold"
                style={{ backgroundColor: profile?.avatarColor || '#10b981' }}
              >
                {(profile?.username || user.email || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 dark:text-white/40">Logged in as</p>
                <p className="text-[13px] font-medium truncate">
                  {profile?.displayName || profile?.username || user.email}
                </p>
                {user.email && (profile?.displayName || profile?.username) && (
                  <p className="text-[11px] text-gray-400 dark:text-white/35 truncate">{user.email}</p>
                )}
              </div>
              {profile?.username && (
                <div className="ml-auto text-[11px] text-emerald-500/90 bg-emerald-500/10 px-2 py-1 rounded-full">
                  @{profile.username}
                </div>
              )}
            </div>
          </div>
          {children}
        </main>
      </div>
    </>
  );
}
