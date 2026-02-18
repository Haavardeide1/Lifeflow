'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mountain,
  LayoutDashboard,
  ClipboardCheck,
  TrendingUp,
  ListChecks,
  Sparkles,
  Trash2,
  X,
  AlertTriangle,
  LogOut,
  User,
} from 'lucide-react';
import { useLifeflowStore } from '@/stores/lifeflowStore';
import { useAuthStore } from '@/stores/authStore';
import { clearAutoSave } from '@/lib/database';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/checkin', label: 'Check In', icon: ClipboardCheck },
  { href: '/wishes', label: 'Wishes', icon: Sparkles },
  { href: '/insights', label: 'Insights', icon: TrendingUp },
  { href: '/habits', label: 'Habits', icon: ListChecks },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const entries = useLifeflowStore((s) => s.entries);
  const clearAll = useLifeflowStore((s) => s.clearAll);
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);

  const hasData = Object.keys(entries).length > 0;

  const handleClearAll = async () => {
    clearAll();
    await clearAutoSave(user?.id);
    setShowConfirmModal(false);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-20 bg-gray-100 dark:bg-gray-900 flex-col items-center py-4 gap-2">
        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center mb-4">
          <Mountain size={20} className="text-white" />
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  w-16 px-1 py-2 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors
                  ${isActive
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
                title={item.label}
              >
                <Icon size={18} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {hasData && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-14 px-1 py-2 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition-colors"
            title="Clear All Data"
          >
            <Trash2 size={18} />
            <span className="text-[10px] font-medium">Clear</span>
          </button>
        )}

        <button
          onClick={signOut}
          className="w-14 px-1 py-2 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-white/70 transition-colors"
          title="Sign Out"
        >
          <LogOut size={18} />
          <span className="text-[10px] font-medium">Sign out</span>
        </button>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-white/[0.06] safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]
                  ${isActive
                    ? 'text-emerald-400'
                    : 'text-gray-500'
                  }
                `}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Confirm modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="relative bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-white/[0.06]">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Clear All Data?</h2>
                <p className="text-[13px] text-gray-500 dark:text-white/50">This action cannot be undone</p>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-[14px] text-gray-600 dark:text-white/70 leading-relaxed">
                All your habits, daily entries, and tracking data will be permanently deleted.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/[0.06]">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-[13px] font-medium text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 rounded-lg text-[13px] font-medium bg-red-500/90 hover:bg-red-500 text-white transition-colors"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
