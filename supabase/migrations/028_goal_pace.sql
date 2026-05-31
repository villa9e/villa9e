-- Migration 028: Goal pace level + workshop preferences
-- Safe to re-run. No ENUMs, no DO blocks.

-- Add pace level to goals
alter table goals add column if not exists pace_level integer default 2;
-- 1 = Wayfinder (full guidance), 2 = Pathfinder (supported), 3 = Trailblazer (autonomous)

alter table goals add column if not exists status_dot text default 'active';
-- 'active' = green dot, 'paused' = red dot

-- Workshop content preferences per user
create table if not exists user_workshop_preferences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade unique,
  preferred_format text default 'any',   -- 'short', 'long', 'any'
  short_views     integer default 0,
  long_views      integer default 0,
  total_views     integer default 0,
  updated_at      timestamptz default now()
);

alter table user_workshop_preferences enable row level security;
drop policy if exists "users own workshop prefs" on user_workshop_preferences;
create policy "users own workshop prefs"
  on user_workshop_preferences for all using (user_id = auth.uid());

-- Track which workshop videos a user has watched per action
create table if not exists workshop_views (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  goal_id     uuid references goals(id) on delete cascade,
  action_ref  text,   -- action title or id used as reference
  video_id    text,   -- youtube video id or studio_video id
  source      text,   -- 'youtube' or 'studio'
  format      text,   -- 'short' or 'long'
  watched_at  timestamptz default now()
);

alter table workshop_views enable row level security;
drop policy if exists "users own workshop views" on workshop_views;
create policy "users own workshop views"
  on workshop_views for all using (user_id = auth.uid());

create index if not exists idx_workshop_views_user on workshop_views(user_id, action_ref);
create index if not exists idx_workshop_views_goal on workshop_views(goal_id);
