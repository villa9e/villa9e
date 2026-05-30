-- Migration 026: Fix admin_world_objects RLS + ensure table exists
-- Run this in Supabase SQL Editor

-- 1. Create table if not exists (safe to re-run)
create table if not exists admin_world_objects (
  id                 uuid primary key default gen_random_uuid(),
  model_url          text not null default '',
  label              text default '',
  world_name         text,
  pos_x              float8 default 0,
  pos_y              float8 default 0,
  pos_z              float8 default 0,
  rot_y              float8 default 0,
  scale              float8 default 1,
  elevation          float8 default 0,
  tint_color         text,
  opacity            float8 default 1,
  is_live            boolean default false,
  is_building        boolean default false,
  linked_page        text,
  linked_feature     text,
  behavior           text default 'none',
  dialog_title       text,
  dialog_content     text,
  iframe_url         text,
  transport_target   text,
  sound_url          text,
  sound_volume       float8 default 0.7,
  sound_trigger_dist float8 default 15,
  sound_max_dist     float8 default 4,
  sound_loop         boolean default true,
  trail_enabled      boolean default false,
  trail_passable     boolean default true,
  trail_points       jsonb default '[]'::jsonb,
  sort_order         int default 0,
  trigger_type       text default 'click',
  trigger_distance   float8 default 5,
  item_info_enabled  boolean default false,
  placed_by          uuid references auth.users(id) on delete set null,
  created_at         timestamptz default now()
);

-- 2. Add any missing columns (safe — alter column if not exists)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='admin_world_objects' and column_name='trigger_type') then
    alter table admin_world_objects add column trigger_type text default 'click';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='admin_world_objects' and column_name='trigger_distance') then
    alter table admin_world_objects add column trigger_distance float8 default 5;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='admin_world_objects' and column_name='item_info_enabled') then
    alter table admin_world_objects add column item_info_enabled boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='admin_world_objects' and column_name='trail_points') then
    alter table admin_world_objects add column trail_points jsonb default '[]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='admin_world_objects' and column_name='world_name') then
    alter table admin_world_objects add column world_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='admin_world_objects' and column_name='elevation') then
    alter table admin_world_objects add column elevation float8 default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='admin_world_objects' and column_name='transport_target') then
    alter table admin_world_objects add column transport_target text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='admin_world_objects' and column_name='placed_by') then
    alter table admin_world_objects add column placed_by uuid references auth.users(id) on delete set null;
  end if;
end $$;

-- 3. Enable RLS
alter table admin_world_objects enable row level security;

-- 4. Drop old policies to avoid conflicts
drop policy if exists "public_read_live"       on admin_world_objects;
drop policy if exists "admin_all"              on admin_world_objects;
drop policy if exists "service_role_all"       on admin_world_objects;
drop policy if exists "anon_read_live"         on admin_world_objects;
drop policy if exists "auth_read_live"         on admin_world_objects;

-- 5. Allow ANYONE (anon + authenticated) to read live objects
--    The village map loads objects for all visitors, even logged-out
create policy "anon_read_live" on admin_world_objects
  for select
  using (is_live = true);

-- 6. Allow authenticated users to read all objects
--    (needed for WorldBuilder loading all objects)
create policy "auth_read_all" on admin_world_objects
  for select
  to authenticated
  using (true);

-- 7. Enable Realtime so village/map updates instantly when sandbox publishes
alter publication supabase_realtime add table admin_world_objects;
