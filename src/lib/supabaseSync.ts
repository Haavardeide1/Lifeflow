import { supabase } from './supabase';
import type {
  Habit,
  DailyEntry,
  DateKey,
  UserProfile,
  FriendPublicStats,
  FriendRequest,
  Wish,
  StatusUpdate,
  StatusComment,
  StatusKudo,
} from '@/types';

// ============================================================
// LOAD all data for the current user
// ============================================================

export async function loadUserData(userId: string): Promise<{
  habits: Habit[];
  wishes: Wish[];
  entries: DailyEntry[];
}> {
  // Load habits
  const { data: habitsData, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order');

  if (habitsError) throw habitsError;

  const habits: Habit[] = (habitsData || []).map((h) => ({
    id: h.id,
    name: h.name,
    type: h.type as 'good' | 'bad',
    weight: h.weight,
    icon: h.icon,
    color: h.color,
    sortOrder: h.sort_order,
    active: h.active,
    createdAt: new Date(h.created_at).getTime(),
    updatedAt: new Date(h.updated_at).getTime(),
  }));

  // Load wishes
  const { data: wishesData, error: wishesError } = await supabase
    .from('wishes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');

  if (wishesError) throw wishesError;

  const wishes: Wish[] = (wishesData || []).map((w) => ({
    id: w.id,
    title: w.title,
    kind: w.kind as 'habit' | 'metric',
    habitId: w.habit_id ?? undefined,
    metric: w.metric ?? undefined,
    targetPerWeek: w.target_per_week ?? undefined,
    targetValue: w.target_value ?? undefined,
    active: w.active,
    createdAt: new Date(w.created_at).getTime(),
    updatedAt: new Date(w.updated_at).getTime(),
  }));

  // Load entries with completions
  const { data: entriesData, error: entriesError } = await supabase
    .from('entries')
    .select(`
      *,
      habit_completions (habit_id, completed, emotional_tags, energy, mood, note)
    `)
    .eq('user_id', userId)
    .order('date');

  if (entriesError) throw entriesError;

  const entries: DailyEntry[] = (entriesData || []).map((e) => ({
    date: e.date as DateKey,
    mood: e.mood,
    energy: e.energy,
    sleep: e.sleep,
    healthScore: Number(e.health_score),
    notes: e.notes,
    habitCompletions: (e.habit_completions || []).map((hc: { habit_id: string; completed: boolean; emotional_tags?: string[]; energy?: number; mood?: number; note?: string }) => ({
      habitId: hc.habit_id,
      completed: hc.completed,
      emotionalTags: hc.emotional_tags || undefined,
      energy: hc.energy ?? undefined,
      mood: hc.mood ?? undefined,
      note: hc.note || undefined,
    })),
    createdAt: new Date(e.created_at).getTime(),
    updatedAt: new Date(e.updated_at).getTime(),
  }));

  return { habits, wishes, entries };
}

// ============================================================
// HABITS
// ============================================================

export async function upsertHabit(userId: string, habit: Habit): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .upsert({
      id: habit.id,
      user_id: userId,
      name: habit.name,
      type: habit.type,
      weight: habit.weight,
      icon: habit.icon,
      color: habit.color,
      sort_order: habit.sortOrder,
      active: habit.active,
      created_at: new Date(habit.createdAt).toISOString(),
      updated_at: new Date(habit.updatedAt).toISOString(),
    }, { onConflict: 'id' });

  if (error) throw error;
}

export async function deleteHabitCloud(habitId: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId);

  if (error) throw error;
}

// ============================================================
// WISHES
// ============================================================

export async function upsertWish(userId: string, wish: Wish): Promise<void> {
  const { error } = await supabase
    .from('wishes')
    .upsert({
      id: wish.id,
      user_id: userId,
      title: wish.title,
      kind: wish.kind,
      habit_id: wish.habitId ?? null,
      metric: wish.metric ?? null,
      target_per_week: wish.targetPerWeek ?? null,
      target_value: wish.targetValue ?? null,
      active: wish.active,
      created_at: new Date(wish.createdAt).toISOString(),
      updated_at: new Date(wish.updatedAt).toISOString(),
    }, { onConflict: 'id' });

  if (error) throw error;
}

export async function upsertWishes(userId: string, wishes: Wish[]): Promise<void> {
  if (wishes.length === 0) return;
  const payload = wishes.map((wish) => ({
    id: wish.id,
    user_id: userId,
    title: wish.title,
    kind: wish.kind,
    habit_id: wish.habitId ?? null,
    metric: wish.metric ?? null,
    target_per_week: wish.targetPerWeek ?? null,
    target_value: wish.targetValue ?? null,
    active: wish.active,
    created_at: new Date(wish.createdAt).toISOString(),
    updated_at: new Date(wish.updatedAt).toISOString(),
  }));

  const { error } = await supabase
    .from('wishes')
    .upsert(payload, { onConflict: 'id' });

  if (error) throw error;
}

export async function deleteWishCloud(wishId: string): Promise<void> {
  const { error } = await supabase
    .from('wishes')
    .delete()
    .eq('id', wishId);

  if (error) throw error;
}

export async function deleteWishesCloud(wishIds: string[]): Promise<void> {
  if (wishIds.length === 0) return;
  const { error } = await supabase
    .from('wishes')
    .delete()
    .in('id', wishIds);

  if (error) throw error;
}

// ============================================================
// ENTRIES
// ============================================================

export async function upsertEntry(
  userId: string,
  entry: DailyEntry
): Promise<void> {
  // Upsert the entry
  const { data, error } = await supabase
    .from('entries')
    .upsert({
      user_id: userId,
      date: entry.date,
      mood: entry.mood,
      energy: entry.energy,
      sleep: entry.sleep,
      health_score: entry.healthScore,
      notes: entry.notes,
      updated_at: new Date(entry.updatedAt).toISOString(),
    }, { onConflict: 'user_id,date' })
    .select('id')
    .single();

  if (error) throw error;

  const entryId = data.id;

  // Delete existing completions for this entry
  await supabase
    .from('habit_completions')
    .delete()
    .eq('entry_id', entryId);

  // Insert new completions
  if (entry.habitCompletions.length > 0) {
    const completions = entry.habitCompletions.map((hc) => ({
      entry_id: entryId,
      habit_id: hc.habitId,
      completed: hc.completed,
      emotional_tags: hc.emotionalTags || null,
      energy: hc.energy ?? null,
      mood: hc.mood ?? null,
      note: hc.note || null,
    }));

    const { error: compError } = await supabase
      .from('habit_completions')
      .insert(completions);

    if (compError) throw compError;
  }
}

export async function deleteEntryCloud(userId: string, date: DateKey): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('user_id', userId)
    .eq('date', date);

  if (error) throw error;
}

// ============================================================
// PROFILES
// ============================================================

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_color, current_streak_days')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarColor: data.avatar_color,
    currentStreakDays: data.current_streak_days,
  };
}

export async function upsertProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'username' | 'displayName' | 'avatarColor' | 'currentStreakDays'>>
): Promise<{ error: string | null }> {
  const payload: Record<string, unknown> = {
    id: userId,
    updated_at: new Date().toISOString(),
  };
  if (updates.username !== undefined) payload.username = updates.username;
  if (updates.displayName !== undefined) payload.display_name = updates.displayName;
  if (updates.avatarColor !== undefined) payload.avatar_color = updates.avatarColor;
  if (updates.currentStreakDays !== undefined) payload.current_streak_days = updates.currentStreakDays;

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    if (error.code === '23505') return { error: 'That username is already taken.' };
    return { error: error.message };
  }
  return { error: null };
}

export async function searchProfileByUsername(username: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_color, current_streak_days')
    .eq('username', username)
    .single();

  if (!data) return null;
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarColor: data.avatar_color,
    currentStreakDays: data.current_streak_days,
  };
}

// ============================================================
// FRIENDS
// ============================================================

export async function fetchFriendsList(userId: string): Promise<FriendPublicStats[]> {
  // Get accepted friend rows (both directions)
  const { data: friendRows } = await supabase
    .from('friends')
    .select('user_id, friend_id')
    .eq('status', 'accepted')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (!friendRows || friendRows.length === 0) return [];

  // Deduplicate friend IDs
  const friendIdSet = new Set<string>();
  friendRows.forEach(r => {
    const fid = r.user_id === userId ? r.friend_id : r.user_id;
    friendIdSet.add(fid);
  });
  const friendIds = Array.from(friendIdSet);

  // Get profiles for friends
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_color, current_streak_days')
    .in('id', friendIds);

  if (!profiles) return [];

  // Get latest entry for each friend (health score + date)
  const results: FriendPublicStats[] = [];
  for (const p of profiles) {
    const { data: latestEntry } = await supabase
      .from('entries')
      .select('health_score, date')
      .eq('user_id', p.id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    results.push({
      userId: p.id,
      username: p.username || 'unknown',
      displayName: p.display_name,
      avatarColor: p.avatar_color,
      currentStreakDays: p.current_streak_days,
      latestHealthScore: latestEntry?.health_score ? Number(latestEntry.health_score) : null,
      lastCheckinDate: latestEntry?.date || null,
    });
  }

  return results;
}

export async function fetchPendingRequests(userId: string): Promise<FriendRequest[]> {
  // Requests where I am the recipient
  const { data } = await supabase
    .from('friends')
    .select('id, user_id, friend_id, status, created_at')
    .eq('friend_id', userId)
    .eq('status', 'pending');

  if (!data || data.length === 0) return [];

  // Get sender profiles
  const senderIds = data.map(r => r.user_id);
  const { data: senderProfiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_color')
    .in('id', senderIds);

  const profileMap = new Map<string, { username: string | null; avatar_color: string }>();
  senderProfiles?.forEach(p => profileMap.set(p.id, p));

  return data.map(r => {
    const sender = profileMap.get(r.user_id);
    return {
      id: r.id,
      userId: r.user_id,
      friendId: r.friend_id,
      status: r.status as 'pending',
      createdAt: r.created_at,
      senderUsername: sender?.username || undefined,
      senderAvatarColor: sender?.avatar_color || undefined,
    };
  });
}

export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string
): Promise<{ error: string | null }> {
  // Check if already friends or pending
  const { data: existing } = await supabase
    .from('friends')
    .select('id, status')
    .or(`and(user_id.eq.${fromUserId},friend_id.eq.${toUserId}),and(user_id.eq.${toUserId},friend_id.eq.${fromUserId})`)
    .limit(1);

  if (existing && existing.length > 0) {
    if (existing[0].status === 'accepted') return { error: 'Already friends!' };
    return { error: 'Friend request already pending.' };
  }

  const { error } = await supabase
    .from('friends')
    .insert({ user_id: fromUserId, friend_id: toUserId, status: 'pending' });

  if (error) return { error: error.message };
  return { error: null };
}

export async function acceptFriendRequest(
  requestId: string,
  currentUserId: string,
  requestFromUserId: string
): Promise<{ error: string | null }> {
  // Update request to accepted
  const { error: e1 } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (e1) return { error: e1.message };

  // Insert reverse row so both see each other
  const { error: e2 } = await supabase
    .from('friends')
    .insert({ user_id: currentUserId, friend_id: requestFromUserId, status: 'accepted' });

  if (e2 && e2.code !== '23505') return { error: e2.message };
  return { error: null };
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  await supabase.from('friends').delete().eq('id', requestId);
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  await supabase
    .from('friends')
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
}

// ============================================================
// SOCIAL STATUS
// ============================================================

export async function fetchStatusUpdates(userIds: string[]): Promise<StatusUpdate[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from('status_updates')
    .select('id, user_id, body, created_at, updated_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = data || [];
  const uniqueIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const profileMap = new Map<string, { username: string | null; display_name: string | null; avatar_color: string | null }>();

  if (uniqueIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_color')
      .in('id', uniqueIds);
    if (profileError) throw profileError;
    profiles?.forEach((p) => profileMap.set(p.id, {
      username: p.username ?? null,
      display_name: p.display_name ?? null,
      avatar_color: p.avatar_color ?? null,
    }));
  }

  return rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      userId: row.user_id,
      body: row.body,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      username: profile?.username ?? null,
      displayName: profile?.display_name ?? null,
      avatarColor: profile?.avatar_color ?? null,
    };
  });
}

export async function createStatusUpdate(userId: string, body: string): Promise<void> {
  const { error } = await supabase
    .from('status_updates')
    .insert({ user_id: userId, body });
  if (error) throw error;
}

export async function fetchStatusComments(statusIds: string[]): Promise<StatusComment[]> {
  if (statusIds.length === 0) return [];
  const { data, error } = await supabase
    .from('status_comments')
    .select('id, status_id, user_id, body, created_at')
    .in('status_id', statusIds)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const rows = data || [];
  const uniqueIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const profileMap = new Map<string, { username: string | null; display_name: string | null; avatar_color: string | null }>();

  if (uniqueIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_color')
      .in('id', uniqueIds);
    if (profileError) throw profileError;
    profiles?.forEach((p) => profileMap.set(p.id, {
      username: p.username ?? null,
      display_name: p.display_name ?? null,
      avatar_color: p.avatar_color ?? null,
    }));
  }

  return rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      statusId: row.status_id,
      userId: row.user_id,
      body: row.body,
      createdAt: row.created_at,
      username: profile?.username ?? null,
      displayName: profile?.display_name ?? null,
      avatarColor: profile?.avatar_color ?? null,
    };
  });
}

export async function createStatusComment(statusId: string, userId: string, body: string): Promise<void> {
  const { error } = await supabase
    .from('status_comments')
    .insert({ status_id: statusId, user_id: userId, body });
  if (error) throw error;
}

export async function fetchStatusKudos(statusIds: string[]): Promise<StatusKudo[]> {
  if (statusIds.length === 0) return [];
  const { data, error } = await supabase
    .from('status_kudos')
    .select('id, status_id, user_id, created_at')
    .in('status_id', statusIds)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const rows = data || [];
  const uniqueIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const profileMap = new Map<string, { username: string | null; display_name: string | null; avatar_color: string | null }>();

  if (uniqueIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_color')
      .in('id', uniqueIds);
    if (profileError) throw profileError;
    profiles?.forEach((p) => profileMap.set(p.id, {
      username: p.username ?? null,
      display_name: p.display_name ?? null,
      avatar_color: p.avatar_color ?? null,
    }));
  }

  return rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      statusId: row.status_id,
      userId: row.user_id,
      createdAt: row.created_at,
      username: profile?.username ?? null,
      displayName: profile?.display_name ?? null,
      avatarColor: profile?.avatar_color ?? null,
    };
  });
}

export async function toggleStatusKudo(statusId: string, userId: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('status_kudos')
    .select('id')
    .eq('status_id', statusId)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing?.id) {
    const { error } = await supabase
      .from('status_kudos')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('status_kudos')
      .insert({ status_id: statusId, user_id: userId });
    if (error) throw error;
  }
}
