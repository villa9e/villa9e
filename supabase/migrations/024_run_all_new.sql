-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 024: Combined safe migration for all new features
-- Run this in Supabase SQL editor if migrations 021-023 had errors.
-- All statements use IF NOT EXISTS / IF EXISTS to be safely re-runnable.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Goal templates: add missing columns ─────────────────────────────────────
alter table goal_templates add column if not exists clone_count integer default 0;
alter table goal_templates add column if not exists oowop_count integer default 0;
create index if not exists gt_clone_count on goal_templates (clone_count desc);

-- ─── Profiles: new columns ───────────────────────────────────────────────────
alter table profiles add column if not exists vlg_balance   integer not null default 0;
alter table profiles add column if not exists has_done_tour boolean not null default false;

-- ─── Pavilion shows ──────────────────────────────────────────────────────────
create table if not exists pavilion_shows (
  id             uuid default gen_random_uuid() primary key,
  host_id        uuid references profiles(id) on delete cascade not null,
  title          text not null,
  description    text,
  type           text not null check (type in ('film','concert','webinar','show','presentation')),
  status         text not null default 'draft' check (status in ('draft','scheduled','live','ended')),
  thumbnail_url  text,
  stream_url     text,
  starts_at      timestamptz,
  ends_at        timestamptz,
  ticket_price   numeric(12,2) default 0,
  ticket_currency text default 'VLG',
  max_attendees  integer,
  attendee_count integer default 0,
  replay_url     text,
  tags           text[],
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
alter table pavilion_shows enable row level security;
drop policy if exists "anyone can view live/ended shows" on pavilion_shows;
create policy "anyone can view live/ended shows"
  on pavilion_shows for select using (status in ('live','ended','scheduled'));
drop policy if exists "host can manage own shows" on pavilion_shows;
create policy "host can manage own shows"
  on pavilion_shows for all using (host_id = auth.uid());

-- ─── Pavilion tickets ────────────────────────────────────────────────────────
create table if not exists pavilion_tickets (
  id       uuid default gen_random_uuid() primary key,
  show_id  uuid references pavilion_shows(id) on delete cascade not null,
  buyer_id uuid references profiles(id) on delete cascade not null,
  price    numeric(12,2) not null default 0,
  currency text default 'VLG',
  status   text default 'valid' check (status in ('valid','used','refunded')),
  purchased_at timestamptz default now(),
  unique (show_id, buyer_id)
);
alter table pavilion_tickets enable row level security;
drop policy if exists "buyer can see own tickets" on pavilion_tickets;
create policy "buyer can see own tickets"
  on pavilion_tickets for select using (buyer_id = auth.uid());
drop policy if exists "buyer can insert" on pavilion_tickets;
create policy "buyer can insert"
  on pavilion_tickets for insert with check (buyer_id = auth.uid());

-- ─── Admin world objects ─────────────────────────────────────────────────────
create table if not exists admin_world_objects (
  id             uuid default gen_random_uuid() primary key,
  model_url      text not null,
  label          text,
  world_name     text,
  pos_x          float not null default 0,
  pos_y          float not null default 0,
  pos_z          float not null default 0,
  rot_y          float not null default 0,
  scale          float not null default 1,
  elevation      float not null default 0,
  tint_color     text,
  opacity        float not null default 1.0,
  is_live        boolean default false,
  is_building    boolean default false,
  placed_by      uuid references profiles(id),
  linked_page    text,
  linked_feature text,
  behavior       text not null default 'none'
    check (behavior in ('none','page','iframe','transport','dialog','sound_zone')),
  dialog_title   text,
  dialog_content text,
  iframe_url     text,
  transport_target text,
  sound_url      text,
  sound_volume   float not null default 0.7,
  sound_trigger_dist float not null default 15,
  sound_max_dist float not null default 4,
  sound_loop     boolean not null default true,
  trail_enabled  boolean not null default false,
  trail_passable boolean not null default true,
  trail_points   jsonb not null default '[]',
  trigger_type   text not null default 'click'
    check (trigger_type in ('click','approach','both')),
  trigger_distance float not null default 5,
  item_info_enabled boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
alter table admin_world_objects enable row level security;

-- Admin-only write
drop policy if exists "admin only world objects" on admin_world_objects;
create policy "admin only world objects"
  on admin_world_objects for all
  using (
    auth.uid() in (select id from profiles where is_super_admin = true)
  );

-- Live objects readable by everyone (needed for village rendering)
drop policy if exists "live objects visible to all" on admin_world_objects;
create policy "live objects visible to all"
  on admin_world_objects for select
  using (is_live = true);

-- Make admin user super admin
update profiles
  set is_super_admin = true
  where email in ('elitehousemusic@gmail.com', 'admin@villa9e.app');

-- ─── VLG item purchases ──────────────────────────────────────────────────────
create table if not exists vlg_purchases (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete cascade not null,
  item_id      text not null,
  price        integer not null,
  purchased_at timestamptz default now(),
  unique (user_id, item_id)
);
alter table vlg_purchases enable row level security;
drop policy if exists "user sees own purchases" on vlg_purchases;
create policy "user sees own purchases"
  on vlg_purchases for select using (user_id = auth.uid());
drop policy if exists "user can insert purchase" on vlg_purchases;
create policy "user can insert purchase"
  on vlg_purchases for insert with check (user_id = auth.uid());

-- ─── purchase_vlg_item RPC ────────────────────────────────────────────────────
create or replace function purchase_vlg_item(
  p_user_id uuid, p_item_id text, p_price integer
) returns void language plpgsql security definer as $$
declare v_balance integer;
begin
  select vlg_balance into v_balance from profiles where id = p_user_id for update;
  if v_balance is null then raise exception 'User not found'; end if;
  if v_balance < p_price then raise exception 'Insufficient VLG balance'; end if;
  if exists (select 1 from vlg_purchases where user_id = p_user_id and item_id = p_item_id)
    then raise exception 'Item already purchased'; end if;
  update profiles set vlg_balance = vlg_balance - p_price, updated_at = now() where id = p_user_id;
  insert into vlg_purchases (user_id, item_id, price) values (p_user_id, p_item_id, p_price);
end;
$$;

-- ─── Tribe events ─────────────────────────────────────────────────────────────
create table if not exists tribe_events (
  id          uuid default gen_random_uuid() primary key,
  tribe_id    uuid references tribes(id) on delete cascade not null,
  creator_id  uuid references profiles(id) on delete set null,
  title       text not null,
  notes       text,
  event_at    timestamptz not null,
  duration_min integer default 60,
  location    text,
  is_video    boolean default false,
  created_at  timestamptz default now()
);
alter table tribe_events enable row level security;
drop policy if exists "tribe members can see events" on tribe_events;
create policy "tribe members can see events"
  on tribe_events for select
  using (tribe_id in (select tribe_id from tribe_members where user_id = auth.uid()));
drop policy if exists "tribe members can insert events" on tribe_events;
create policy "tribe members can insert events"
  on tribe_events for insert
  with check (tribe_id in (select tribe_id from tribe_members where user_id = auth.uid()));

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_pavilion_shows_status     on pavilion_shows(status);
create index if not exists idx_pavilion_shows_host       on pavilion_shows(host_id);
create index if not exists idx_admin_world_objects_live  on admin_world_objects(is_live);
create index if not exists idx_admin_world_objects_build on admin_world_objects(is_building, is_live);
create index if not exists idx_vlg_purchases_user        on vlg_purchases(user_id);
create index if not exists idx_tribe_events_tribe        on tribe_events(tribe_id);
create index if not exists idx_tribe_events_at           on tribe_events(event_at);
