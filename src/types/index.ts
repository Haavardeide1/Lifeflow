// ============================================================
// HABIT DEFINITIONS
// ============================================================

export type HabitType = 'good' | 'bad';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  /** Subjective impact weight: 1 (minimal) to 10 (life-changing) */
  weight: number;
  /** Lucide icon name, e.g. "dumbbell", "phone", "monitor" */
  icon: string;
  /** Hex color, e.g. "#22c55e" */
  color: string;
  /** Sort order in check-in form */
  sortOrder: number;
  /** Whether this habit is currently active (soft delete) */
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// WISHES / GOALS
// ============================================================

export type WishKind = 'habit' | 'metric';
export type WishMetric = 'mood' | 'energy' | 'sleep' | 'healthScore';

export interface Wish {
  id: string;
  title: string;
  kind: WishKind;
  habitId?: string;
  metric?: WishMetric;
  /** Weekly target for habit-based wishes */
  targetPerWeek?: number;
  /** Target value for metric-based wishes (1-10) */
  targetValue?: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// DAILY ENTRIES
// ============================================================

/** Date string in YYYY-MM-DD format, used as primary key */
export type DateKey = string;

export interface HabitCompletion {
  habitId: string;
  completed: boolean;
  emotionalTags?: string[];
  energy?: number;
  mood?: number;
  note?: string;
}

/** Local check-in form state for a single habit */
export interface HabitFeedback {
  completed: boolean;
  emotionalTags?: string[];
  energy?: number;
  mood?: number;
  note?: string;
}

export interface DailyEntry {
  /** YYYY-MM-DD format, serves as unique key */
  date: DateKey;
  /** Overall mood rating 1-10 */
  mood: number;
  /** Energy level 1-10 */
  energy: number;
  /** Sleep quality 1-10 */
  sleep: number;
  /** Which habits were completed that day */
  habitCompletions: HabitCompletion[];
  /** Optional free-text notes */
  notes: string;
  /** Pre-computed health score for this day */
  healthScore: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// COMPUTED / DERIVED TYPES
// ============================================================

export interface HealthScoreDataPoint {
  date: DateKey;
  score: number;
  mood: number;
  energy: number;
  sleep: number;
}

export interface HabitCorrelation {
  habitId: string;
  habitName: string;
  habitType: HabitType;
  correlationWithMood: number;
  correlationWithEnergy: number;
  correlationWithHealthScore: number;
  completionCount: number;
  totalDays: number;
  completionRate: number;
}

export interface StreakInfo {
  habitId: string;
  habitName: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: DateKey;
}

// ============================================================
// UNDO/REDO
// ============================================================

export interface LifeflowSnapshot {
  habits: Record<string, Habit>;
  wishes: Record<string, Wish>;
  entries: Record<DateKey, DailyEntry>;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  description: string;
  snapshot: LifeflowSnapshot;
}

// ============================================================
// UI TYPES
// ============================================================

export type TimePeriod = '7d' | '30d' | '90d' | 'all';

export type Theme = 'dark' | 'light';

// ============================================================
// PROFILE & FRIENDS
// ============================================================

export interface UserProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarColor: string;
  currentStreakDays: number;
}

export type FriendStatus = 'pending' | 'accepted';

export interface FriendRequest {
  id: string;
  userId: string;
  friendId: string;
  status: FriendStatus;
  createdAt: string;
  senderUsername?: string;
  senderAvatarColor?: string;
}

export interface FriendPublicStats {
  userId: string;
  username: string;
  displayName: string | null;
  avatarColor: string;
  currentStreakDays: number;
  latestHealthScore: number | null;
  lastCheckinDate: string | null;
}
