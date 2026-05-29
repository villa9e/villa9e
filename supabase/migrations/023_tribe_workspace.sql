-- ─── Tribe workspace: events calendar, shared docs ───────────────────────────

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

create policy "tribe members can see events"
  on tribe_events for select
  using (
    tribe_id in (
      select tribe_id from tribe_members where user_id = auth.uid()
    )
  );

create policy "tribe members can insert events"
  on tribe_events for insert
  with check (
    tribe_id in (
      select tribe_id from tribe_members where user_id = auth.uid()
    )
  );

create index if not exists idx_tribe_events_tribe on tribe_events(tribe_id);
create index if not exists idx_tribe_events_at    on tribe_events(event_at);
