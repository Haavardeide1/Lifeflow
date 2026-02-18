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

-- 3b. Wishes / goals
create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  kind text not null check (kind in ('habit', 'metric')),
  habit_id uuid references public.habits(id) on delete cascade null,
  metric text null check (metric in ('mood', 'energy', 'sleep', 'healthScore')),
  target_per_week integer null check (target_per_week between 1 and 7),
  target_value numeric(4,1) null check (target_value between 1 and 10),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3c. Social statuses
create table public.status_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.status_comments (
  id uuid primary key default gen_random_uuid(),
  status_id uuid references public.status_updates(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.status_kudos (
  id uuid primary key default gen_random_uuid(),
  status_id uuid references public.status_updates(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(status_id, user_id)
);

-- 4. Row Level Security (each user only sees their own data)
alter table public.habits enable row level security;
alter table public.entries enable row level security;
alter table public.habit_completions enable row level security;
alter table public.wishes enable row level security;
alter table public.status_updates enable row level security;
alter table public.status_comments enable row level security;
alter table public.status_kudos enable row level security;

-- Habits: users can CRUD their own
create policy "Users can view own habits" on public.habits
  for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on public.habits
  for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on public.habits
  for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on public.habits
  for delete using (auth.uid() = user_id);

-- Wishes: users can CRUD their own
create policy "Users can view own wishes" on public.wishes
  for select using (auth.uid() = user_id);
create policy "Users can insert own wishes" on public.wishes
  for insert with check (auth.uid() = user_id);
create policy "Users can update own wishes" on public.wishes
  for update using (auth.uid() = user_id);
create policy "Users can delete own wishes" on public.wishes
  for delete using (auth.uid() = user_id);

-- Status updates: users can view own + friends
create policy "Users can view own or friends status" on public.status_updates
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.friends
      where friends.user_id = auth.uid()
        and friends.friend_id = status_updates.user_id
        and friends.status = 'accepted'
    )
  );
create policy "Users can insert own status" on public.status_updates
  for insert with check (auth.uid() = user_id);
create policy "Users can update own status" on public.status_updates
  for update using (auth.uid() = user_id);
create policy "Users can delete own status" on public.status_updates
  for delete using (auth.uid() = user_id);

-- Status comments: users can view/comment if status is visible to them
create policy "Users can view comments on visible status" on public.status_comments
  for select using (
    exists (
      select 1 from public.status_updates su
      where su.id = status_comments.status_id
        and (
          su.user_id = auth.uid()
          or exists (
            select 1 from public.friends
            where friends.user_id = auth.uid()
              and friends.friend_id = su.user_id
              and friends.status = 'accepted'
          )
        )
    )
  );
create policy "Users can insert own comments on visible status" on public.status_comments
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.status_updates su
      where su.id = status_comments.status_id
        and (
          su.user_id = auth.uid()
          or exists (
            select 1 from public.friends
            where friends.user_id = auth.uid()
              and friends.friend_id = su.user_id
              and friends.status = 'accepted'
          )
        )
    )
  );
create policy "Users can delete own comments" on public.status_comments
  for delete using (auth.uid() = user_id);

-- Status kudos: users can view/add/remove if status is visible to them
create policy "Users can view kudos on visible status" on public.status_kudos
  for select using (
    exists (
      select 1 from public.status_updates su
      where su.id = status_kudos.status_id
        and (
          su.user_id = auth.uid()
          or exists (
            select 1 from public.friends
            where friends.user_id = auth.uid()
              and friends.friend_id = su.user_id
              and friends.status = 'accepted'
          )
        )
    )
  );
create policy "Users can add kudos on visible status" on public.status_kudos
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.status_updates su
      where su.id = status_kudos.status_id
        and (
          su.user_id = auth.uid()
          or exists (
            select 1 from public.friends
            where friends.user_id = auth.uid()
              and friends.friend_id = su.user_id
              and friends.status = 'accepted'
          )
        )
    )
  );
create policy "Users can delete own kudos" on public.status_kudos
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
create index idx_wishes_user_id on public.wishes(user_id);
create index idx_status_updates_user_id on public.status_updates(user_id);
create index idx_status_updates_created_at on public.status_updates(created_at);
create index idx_status_comments_status_id on public.status_comments(status_id);
create index idx_status_kudos_status_id on public.status_kudos(status_id);

-- =============================================
-- Optional: if you already created tables before adding new columns
-- =============================================
alter table public.habit_completions
  add column if not exists emotional_tags text[],
  add column if not exists energy integer,
  add column if not exists mood integer,
  add column if not exists note text;
