'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useProfileStore } from '@/stores/profileStore';
import { Card } from '@/components/shared/Card';
import {
  Sun,
  Moon,
  UserPlus,
  Check,
  X,
  UserMinus,
  Trophy,
  Flame,
  Mail,
} from 'lucide-react';

const AVATAR_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#a855f7', '#ec4899', '#14b8a6', '#f97316',
];

function validateUsername(u: string): string | null {
  if (u.length < 3) return 'At least 3 characters.';
  if (u.length > 20) return '20 characters max.';
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Only letters, numbers, and underscores.';
  return null;
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const profile = useProfileStore((s) => s.profile);
  const friends = useProfileStore((s) => s.friends);
  const pendingRequests = useProfileStore((s) => s.pendingRequests);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const fetchFriends = useProfileStore((s) => s.fetchFriends);
  const fetchPendingRequests = useProfileStore((s) => s.fetchPendingRequests);
  const sendFriendRequest = useProfileStore((s) => s.sendFriendRequest);
  const acceptRequest = useProfileStore((s) => s.acceptRequest);
  const declineRequest = useProfileStore((s) => s.declineRequest);
  const removeFriend = useProfileStore((s) => s.removeFriend);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#22c55e');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendError, setAddFriendError] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
      fetchFriends(user.id);
      fetchPendingRequests(user.id);
    }
  }, [user, fetchProfile, fetchFriends, fetchPendingRequests]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setDisplayName(profile.displayName ?? '');
      setAvatarColor(profile.avatarColor);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaveError('');
    setSaveSuccess(false);

    const validationError = validateUsername(username);
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setSaving(true);
    const result = await updateProfile(user!.id, {
      username,
      displayName: displayName || null,
      avatarColor,
    });
    setSaving(false);

    if (result.error) {
      setSaveError(result.error);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleAddFriend = async () => {
    setAddFriendError('');
    setAddFriendSuccess(false);
    if (!addFriendInput.trim()) return;

    const result = await sendFriendRequest(user!.id, addFriendInput.trim());
    if (result.error) {
      setAddFriendError(result.error);
    } else {
      setAddFriendSuccess(true);
      setAddFriendInput('');
      setTimeout(() => setAddFriendSuccess(false), 2000);
    }
  };

  const sortedFriends = [...friends].sort((a, b) =>
    (b.latestHealthScore ?? 0) - (a.latestHealthScore ?? 0)
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <h1 className="text-[20px] font-semibold">Profile</h1>

        {/* Account Info */}
        <Card title="Account">
          <div className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: avatarColor }}
              >
                {(username || user?.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {profile?.username && (
                  <p className="text-[15px] font-semibold">@{profile.username}</p>
                )}
                <div className="flex items-center gap-1.5">
                  <Mail size={12} className="text-gray-400 dark:text-white/40" />
                  <p className="text-[13px] text-gray-500 dark:text-white/50 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Settings */}
        <Card title="Profile Settings">
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="text-[12px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setSaveError(''); }}
                placeholder="your_username"
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none focus:border-gray-400 dark:focus:border-white/20 transition-colors"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider">Display Name (optional)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none focus:border-gray-400 dark:focus:border-white/20 transition-colors"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider">Avatar Color</label>
              <div className="mt-2 flex gap-2 flex-wrap">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setAvatarColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      avatarColor === c
                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-950 ring-gray-900 dark:ring-white'
                        : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {saveError && (
              <p className="text-[13px] text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{saveError}</p>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className={`w-full py-2.5 rounded-xl text-[14px] font-semibold transition-all flex items-center justify-center gap-2 ${
                saveSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              } disabled:opacity-50`}
            >
              {saveSuccess ? (
                <><Check size={16} /> Saved!</>
              ) : saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </Card>

        {/* Theme Toggle */}
        <Card title="Appearance">
          <div className="px-5 py-4">
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                    : 'bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.06]'
                }`}
              >
                <Sun size={16} />
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.06]'
                }`}
              >
                <Moon size={16} />
                Dark
              </button>
            </div>
          </div>
        </Card>

        {/* Friends */}
        <Card>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-white/[0.06]">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-3 text-[13px] font-medium transition-colors ${
                activeTab === 'friends'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-gray-400 dark:text-white/40'
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 text-[13px] font-medium transition-colors relative ${
                activeTab === 'requests'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-gray-400 dark:text-white/40'
              }`}
            >
              Requests
              {pendingRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'friends' && (
            <div>
              {/* Add friend form */}
              <div className="px-5 py-4 border-b border-gray-200 dark:border-white/[0.06]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addFriendInput}
                    onChange={(e) => { setAddFriendInput(e.target.value); setAddFriendError(''); setAddFriendSuccess(false); }}
                    placeholder="Enter username..."
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none focus:border-gray-400 dark:focus:border-white/20 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                  />
                  <button
                    onClick={handleAddFriend}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-medium transition-colors flex items-center gap-1.5"
                  >
                    <UserPlus size={14} />
                    Add
                  </button>
                </div>
                {addFriendError && (
                  <p className="text-[12px] text-red-400 mt-2">{addFriendError}</p>
                )}
                {addFriendSuccess && (
                  <p className="text-[12px] text-emerald-400 mt-2">Friend request sent!</p>
                )}
              </div>

              {/* Friends leaderboard */}
              {sortedFriends.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-[13px] text-gray-400 dark:text-white/40">No friends yet. Add someone by username!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-white/[0.04]">
                  {sortedFriends.map((friend, i) => (
                    <div key={friend.userId} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-[13px] font-bold text-gray-400 dark:text-white/30 w-5">
                        {i + 1}
                      </span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: friend.avatarColor }}
                      >
                        {(friend.username || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">@{friend.username}</p>
                        {friend.displayName && (
                          <p className="text-[11px] text-gray-400 dark:text-white/40 truncate">{friend.displayName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {friend.latestHealthScore !== null && (
                          <div className="flex items-center gap-1">
                            <Trophy size={12} className="text-amber-400" />
                            <span className="text-[13px] font-bold text-emerald-400">
                              {friend.latestHealthScore}
                            </span>
                          </div>
                        )}
                        {friend.currentStreakDays > 0 && (
                          <div className="flex items-center gap-1">
                            <Flame size={12} className="text-orange-400" />
                            <span className="text-[12px] text-gray-500 dark:text-white/50">
                              {friend.currentStreakDays}d
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => removeFriend(user!.id, friend.userId)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 dark:text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove friend"
                        >
                          <UserMinus size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              {pendingRequests.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-[13px] text-gray-400 dark:text-white/40">No pending requests.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-white/[0.04]">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="flex items-center gap-3 px-5 py-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: req.senderAvatarColor || '#6366f1' }}
                      >
                        {(req.senderUsername || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">
                          {req.senderUsername ? `@${req.senderUsername}` : 'Unknown user'}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-white/40">wants to be your friend</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => acceptRequest(req.id, user!.id, req.userId)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          title="Accept"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => declineRequest(req.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Decline"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Sign Out */}
        <button
          onClick={signOut}
          className="w-full py-3 rounded-xl text-[14px] font-medium text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors"
        >
          Sign Out
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}
