-- ─── Fix: add missing columns to goal_templates if table already existed ──────
-- Run this if migration 019 threw "column clone_count does not exist"
alter table goal_templates add column if not exists clone_count integer default 0;
alter table goal_templates add column if not exists oowop_count integer default 0;

-- Recreate indexes safely
create index if not exists gt_clone_count on goal_templates (clone_count desc);

-- ─── Fix: 021 admin_world_objects with correct admin check ────────────────────
-- Run this after applying 021_pavilion_world_admin.sql if it errored on "role"

create table if not exists admin_world_objects (
  id         uuid default gen_random_uuid() primary key,
  model_url  text not null,
  label      text,
  pos_x      float not null default 0,
  pos_y      float not null default 0,
  pos_z      float not null default 0,
  rot_y      float not null default 0,
  scale      float not null default 1,
  biome      text,
  placed_by  uuid references profiles(id),
  is_live    boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table admin_world_objects enable row level security;

-- Drop old policy if it exists from a partial run
drop policy if exists "admin only world objects" on admin_world_objects;
drop policy if exists "live objects visible to all" on admin_world_objects;

-- Uses is_super_admin (added by migration 005)
create policy "admin only world objects"
  on admin_world_objects for all
  using (
    auth.uid() in (
      select id from profiles where is_super_admin = true
    )
  );

create policy "live objects visible to all"
  on admin_world_objects for select
  using (is_live = true);

-- Ensure admin has is_super_admin set
update profiles
set is_super_admin = true
where email in ('elitehousemusic@gmail.com', 'admin@villa9e.app');

create index if not exists idx_admin_world_objects_live on admin_world_objects(is_live);
