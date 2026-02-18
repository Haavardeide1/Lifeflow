-- ============================================================
-- PROFILES TABLE
-- ============================================================
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  username         text unique,
  display_name     text,
  avatar_color     text not null default '#22c55e',
  current_streak_days int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read any profile with a username (for friend search + display)
create policy "profiles: public read"
  on public.profiles for select
  using (username is not null or auth.uid() = id);

-- Users can insert their own profile
create policy "profiles: own insert"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FRIENDS TABLE
-- ============================================================
create table public.friends (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  friend_id   uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at  timestamptz not null default now(),
  unique (user_id, friend_id)
);

alter table public.friends enable row level security;

-- Users can see requests they sent or received
create policy "friends: involved read"
  on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Users can send friend requests
create policy "friends: send request"
  on public.friends for insert
  with check (auth.uid() = user_id);

-- Recipient can accept
create policy "friends: accept"
  on public.friends for update
  using (auth.uid() = friend_id);

-- Either party can remove
create policy "friends: delete"
  on public.friends for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Index for fast lookups
create index idx_friends_user on public.friends(user_id);
create index idx_friends_friend on public.friends(friend_id);
