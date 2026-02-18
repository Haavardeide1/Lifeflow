-- =============================================
-- LIFEFLOW DATABASE SETUP
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================

-- 1. Habits table
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('good', 'bad')),
  weight integer not null default 5 check (weight between 1 and 10),
  icon text not null default 'heart',
  color text not null default '#22c55e',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Daily entries table
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  mood integer not null check (mood between 1 and 10),
  energy integer not null check (energy between 1 and 10),
  sleep integer not null check (sleep between 1 and 10),
  health_score numeric(4,1) not null default 5.0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

-- 3. Habit completions table
create table public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.entries(id) on delete cascade not null,
  habit_id uuid references public.habits(id) on delete cascade not null,
  completed boolean not null default false,
  emotional_tags text[] null,
  energy integer null check (energy between 1 and 10),
  mood integer null check (mood between 1 and 10),
  note text null,
  unique(entry_id, habit_id)
);

-- 4. Row Level Security (each user only sees their own data)
alter table public.habits enable row level security;
alter table public.entries enable row level security;
alter table public.habit_completions enable row level security;

-- Habits: users can CRUD their own
create policy "Users can view own habits" on public.habits
  for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on public.habits
  for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on public.habits
  for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on public.habits
  for delete using (auth.uid() = user_id);

-- Entries: users can CRUD their own
create policy "Users can view own entries" on public.entries
  for select using (auth.uid() = user_id);
create policy "Users can insert own entries" on public.entries
  for insert with check (auth.uid() = user_id);
create policy "Users can update own entries" on public.entries
  for update using (auth.uid() = user_id);
create policy "Users can delete own entries" on public.entries
  for delete using (auth.uid() = user_id);

-- Habit completions: users can CRUD via their entries
create policy "Users can view own completions" on public.habit_completions
  for select using (
    exists (select 1 from public.entries where entries.id = habit_completions.entry_id and entries.user_id = auth.uid())
  );
create policy "Users can insert own completions" on public.habit_completions
  for insert with check (
    exists (select 1 from public.entries where entries.id = habit_completions.entry_id and entries.user_id = auth.uid())
  );
create policy "Users can update own completions" on public.habit_completions
  for update using (
    exists (select 1 from public.entries where entries.id = habit_completions.entry_id and entries.user_id = auth.uid())
  );
create policy "Users can delete own completions" on public.habit_completions
  for delete using (
    exists (select 1 from public.entries where entries.id = habit_completions.entry_id and entries.user_id = auth.uid())
  );

-- 5. Indexes for performance
create index idx_habits_user_id on public.habits(user_id);
create index idx_entries_user_id_date on public.entries(user_id, date);
create index idx_habit_completions_entry_id on public.habit_completions(entry_id);

-- =============================================
-- Optional: if you already created tables before adding new columns
-- =============================================
alter table public.habit_completions
  add column if not exists emotional_tags text[],
  add column if not exists energy integer,
  add column if not exists mood integer,
  add column if not exists note text;
