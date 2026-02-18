import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    set({ user: data.user });
    // Kick off profile load
    if (data.user) {
      import('@/stores/profileStore').then(({ useProfileStore }) => {
        useProfileStore.getState().fetchProfile(data.user!.id);
      });
    }
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
    // Reset profile state
    import('@/stores/profileStore').then(({ useProfileStore }) => {
      useProfileStore.getState().reset();
    });
    // Reset lifeflow state to avoid leaking cached data between users
    import('@/stores/lifeflowStore').then(({ useLifeflowStore }) => {
      useLifeflowStore.getState().loadData([], [], []);
    });
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, loading: false });

    // Load profile if already logged in
    if (session?.user) {
      import('@/stores/profileStore').then(({ useProfileStore }) => {
        useProfileStore.getState().fetchProfile(session.user.id);
      });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },
}));
