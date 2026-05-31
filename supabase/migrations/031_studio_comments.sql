-- Studio-specific comments (separate from dream_line_posts post_comments)
create table if not exists studio_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references studio_posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  parent_id   uuid references studio_comments(id) on delete cascade,
  content     text not null,
  oowop_count integer not null default 0,
  is_flagged  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists studio_comments_post_idx   on studio_comments(post_id);
create index if not exists studio_comments_user_idx   on studio_comments(user_id);
create index if not exists studio_comments_parent_idx on studio_comments(parent_id);

alter table studio_comments enable row level security;

drop policy if exists "view all studio comments" on studio_comments;
create policy "view all studio comments" on studio_comments
  for select using (true);

drop policy if exists "users create studio comments" on studio_comments;
create policy "users create studio comments" on studio_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "users delete own studio comments" on studio_comments;
create policy "users delete own studio comments" on studio_comments
  for delete using (auth.uid() = user_id);

-- dream_line_posts already has comment_count via trigger in schema.sql
-- studio_posts needs comment_count (added in migration 030)
-- Ensure it exists
alter table studio_posts add column if not exists comment_count integer not null default 0;
