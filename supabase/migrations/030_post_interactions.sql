-- Post interactions: oowop_count, comment_count on studio_posts
-- New columns on studio_posts for missing fields
alter table studio_posts add column if not exists oowop_count integer not null default 0;
alter table studio_posts add column if not exists comment_count integer not null default 0;
alter table studio_posts add column if not exists allow_high_quality boolean not null default true;
alter table studio_posts add column if not exists video_language text not null default 'English';

-- Ensure post_oowops exists (may already exist from migration 029)
create table if not exists post_oowops (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references studio_posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create index if not exists post_oowops_post_idx  on post_oowops(post_id);
create index if not exists post_oowops_user_idx  on post_oowops(user_id);

-- Ensure post_favorites exists
create table if not exists post_favorites (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references studio_posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create index if not exists post_favorites_post_idx on post_favorites(post_id);
create index if not exists post_favorites_user_idx on post_favorites(user_id);

-- post_comments already exists in schema.sql referencing dream_line_posts
-- Add parent_id column alias if not present (schema.sql uses parent_comment_id)
alter table post_comments add column if not exists parent_id uuid references post_comments(id) on delete cascade;

create index if not exists post_comments_parent_idx on post_comments(parent_id);

-- RLS for post_oowops
alter table post_oowops enable row level security;
drop policy if exists "users manage own oowops" on post_oowops;
create policy "users manage own oowops" on post_oowops
  for all using (auth.uid() = user_id);

drop policy if exists "view all oowops" on post_oowops;
create policy "view all oowops" on post_oowops
  for select using (true);

-- RLS for post_favorites
alter table post_favorites enable row level security;
drop policy if exists "users manage own favorites" on post_favorites;
create policy "users manage own favorites" on post_favorites
  for all using (auth.uid() = user_id);

drop policy if exists "view all favorites" on post_favorites;
create policy "view all favorites" on post_favorites
  for select using (true);

-- notifications actor_id column (for oowop/comment notifications)
alter table notifications add column if not exists actor_id uuid references profiles(id) on delete set null;
