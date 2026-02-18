import { create } from 'zustand';
import type { UserProfile, FriendPublicStats, FriendRequest } from '@/types';
import {
  fetchProfile as fetchProfileApi,
  upsertProfile,
  searchProfileByUsername,
  fetchFriendsList,
  fetchPendingRequests as fetchPendingApi,
  sendFriendRequest as sendRequestApi,
  acceptFriendRequest as acceptRequestApi,
  declineFriendRequest as declineRequestApi,
  removeFriend as removeFriendApi,
} from '@/lib/supabaseSync';

interface ProfileState {
  profile: UserProfile | null;
  friends: FriendPublicStats[];
  pendingRequests: FriendRequest[];
  loading: boolean;

  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<Pick<UserProfile, 'username' | 'displayName' | 'avatarColor'>>) => Promise<{ error: string | null }>;
  updateStreakDays: (userId: string, days: number) => Promise<void>;
  fetchFriends: (userId: string) => Promise<void>;
  fetchPendingRequests: (userId: string) => Promise<void>;
  searchUser: (username: string) => Promise<UserProfile | null>;
  sendFriendRequest: (fromUserId: string, toUsername: string) => Promise<{ error: string | null }>;
  acceptRequest: (requestId: string, currentUserId: string, fromUserId: string) => Promise<{ error: string | null }>;
  declineRequest: (requestId: string) => Promise<void>;
  removeFriend: (userId: string, friendId: string) => Promise<void>;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>()((set) => ({
  profile: null,
  friends: [],
  pendingRequests: [],
  loading: false,

  fetchProfile: async (userId) => {
    set({ loading: true });
    const profile = await fetchProfileApi(userId);
    set({ profile, loading: false });
  },

  updateProfile: async (userId, updates) => {
    const result = await upsertProfile(userId, updates);
    if (!result.error) {
      set((state) => ({
        profile: state.profile
          ? { ...state.profile, ...updates }
          : null,
      }));
    }
    return result;
  },

  updateStreakDays: async (userId, days) => {
    await upsertProfile(userId, { currentStreakDays: days });
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, currentStreakDays: days }
        : null,
    }));
  },

  fetchFriends: async (userId) => {
    const friends = await fetchFriendsList(userId);
    set({ friends });
  },

  fetchPendingRequests: async (userId) => {
    const pendingRequests = await fetchPendingApi(userId);
    set({ pendingRequests });
  },

  searchUser: async (username) => {
    return searchProfileByUsername(username);
  },

  sendFriendRequest: async (fromUserId, toUsername) => {
    // Search for user first
    const target = await searchProfileByUsername(toUsername);
    if (!target) return { error: 'User not found.' };
    if (target.id === fromUserId) return { error: "You can't add yourself!" };

    const result = await sendRequestApi(fromUserId, target.id);
    return result;
  },

  acceptRequest: async (requestId, currentUserId, fromUserId) => {
    const result = await acceptRequestApi(requestId, currentUserId, fromUserId);
    if (!result.error) {
      // Remove from pending, refresh friends
      set((state) => ({
        pendingRequests: state.pendingRequests.filter(r => r.id !== requestId),
      }));
      // Refresh friends list
      const friends = await fetchFriendsList(currentUserId);
      set({ friends });
    }
    return result;
  },

  declineRequest: async (requestId) => {
    await declineRequestApi(requestId);
    set((state) => ({
      pendingRequests: state.pendingRequests.filter(r => r.id !== requestId),
    }));
  },

  removeFriend: async (userId, friendId) => {
    await removeFriendApi(userId, friendId);
    set((state) => ({
      friends: state.friends.filter(f => f.userId !== friendId),
    }));
  },

  reset: () => set({ profile: null, friends: [], pendingRequests: [] }),
}));
