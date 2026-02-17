'use client';

import { Sidebar } from './Sidebar';
import { usePersistence } from '@/hooks/usePersistence';
import { useSeedData } from '@/hooks/useSeedData';

export function AppShell({ children }: { children: React.ReactNode }) {
  usePersistence();
  useSeedData();

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
