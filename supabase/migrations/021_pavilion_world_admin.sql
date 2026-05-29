-- ─── Pavilion shows ──────────────────────────────────────────────────────────
create table if not exists pavilion_shows (
  id           uuid default gen_random_uuid() primary key,
  host_id      uuid references profiles(id) on delete cascade not null,
  title        text not null,
  description  text,
  type         text not null check (type in ('film','concert','webinar','show','presentation')),
  status       text not null default 'draft' check (status in ('draft','scheduled','live','ended')),
  thumbnail_url text,
  stream_url   text,
  starts_at    timestamptz,
  ends_at      timestamptz,
  ticket_price numeric(12,2) default 0,   -- 0 = free
  ticket_currency text default 'VLG',
  max_attendees integer,
  attendee_count integer default 0,
  replay_url   text,
  tags         text[],
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table pavilion_shows enable row level security;

create policy "anyone can view live/ended shows"
  on pavilion_shows for select
  using (status in ('live','ended','scheduled'));

create policy "host can manage own shows"
  on pavilion_shows for all
  using (host_id = auth.uid());

create policy "host can insert"
  on pavilion_shows for insert
  with check (host_id = auth.uid());

-- ─── Pavilion tickets ─────────────────────────────────────────────────────────
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

create policy "buyer can see own tickets"
  on pavilion_tickets for select
  using (buyer_id = auth.uid());

create policy "buyer can insert"
  on pavilion_tickets for insert
  with check (buyer_id = auth.uid());

create policy "host can see tickets for their shows"
  on pavilion_tickets for select
  using (
    show_id in (select id from pavilion_shows where host_id = auth.uid())
  );

-- ─── Admin world objects — drag-and-drop placed GLTF models ──────────────────
create table if not exists admin_world_objects (
  id         uuid default gen_random_uuid() primary key,
  model_url  text not null,
  label      text,
  pos_x      float not null default 0,
  pos_y      float not null default 0,
  pos_z      float not null default 0,
  rot_y      float not null default 0,
  scale      float not null default 1,
  biome      text,                          -- 'forest','farm','icy','coastal','market'
  placed_by  uuid references profiles(id),
  is_live    boolean default false,         -- true = rendered in live world
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table admin_world_objects enable row level security;

-- Only admins can see/edit world objects
create policy "admin only world objects"
  on admin_world_objects for all
  using (
    auth.uid() in (
      select id from profiles where role = 'admin'
    )
  );

-- Live objects are visible to all (for VillageEnvironment to read)
create policy "live objects visible to all"
  on admin_world_objects for select
  using (is_live = true);

-- ─── VLG item purchases ──────────────────────────────────────────────────────
create table if not exists vlg_purchases (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  item_id     text not null,
  price       integer not null,
  purchased_at timestamptz default now(),
  unique (user_id, item_id)
);

alter table vlg_purchases enable row level security;

create policy "user sees own purchases"
  on vlg_purchases for select
  using (user_id = auth.uid());

create policy "user can insert purchase"
  on vlg_purchases for insert
  with check (user_id = auth.uid());

-- ─── purchase_vlg_item RPC ────────────────────────────────────────────────────
create or replace function purchase_vlg_item(
  p_user_id  uuid,
  p_item_id  text,
  p_price    integer
) returns void
language plpgsql security definer as $$
declare
  v_balance integer;
begin
  -- Lock the row to prevent concurrent double-purchase
  select vlg_balance into v_balance
  from profiles
  where id = p_user_id
  for update;

  if v_balance is null then
    raise exception 'User not found';
  end if;

  if v_balance < p_price then
    raise exception 'Insufficient VLG balance';
  end if;

  -- Check not already purchased
  if exists (select 1 from vlg_purchases where user_id = p_user_id and item_id = p_item_id) then
    raise exception 'Item already purchased';
  end if;

  -- Debit balance
  update profiles
  set vlg_balance = vlg_balance - p_price,
      updated_at  = now()
  where id = p_user_id;

  -- Record purchase
  insert into vlg_purchases (user_id, item_id, price)
  values (p_user_id, p_item_id, p_price);
end;
$$;

-- ─── Ensure vlg_balance and has_done_tour columns exist on profiles ──────────
alter table profiles add column if not exists vlg_balance   integer not null default 0;
alter table profiles add column if not exists has_done_tour boolean not null default false;

-- Indexes
create index if not exists idx_pavilion_shows_status    on pavilion_shows(status);
create index if not exists idx_pavilion_shows_host      on pavilion_shows(host_id);
create index if not exists idx_pavilion_shows_starts_at on pavilion_shows(starts_at);
create index if not exists idx_admin_world_objects_live on admin_world_objects(is_live);
create index if not exists idx_vlg_purchases_user       on vlg_purchases(user_id);
