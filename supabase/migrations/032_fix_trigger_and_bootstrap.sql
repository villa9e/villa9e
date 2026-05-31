-- ============================================================
-- 032: Make handle_new_user() crash-safe + ensure all tables it
--      references exist so user signup never fails with a 500.
-- ============================================================

-- Ensure all tables the trigger touches exist before redefining it
create table if not exists village_wallets (
  user_id uuid primary key references profiles(id) on delete cascade,
  vlg_balance numeric not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists hut_configs (
  user_id    uuid primary key references profiles(id) on delete cascade,
  theme      text not null default 'default',
  created_at timestamptz not null default now()
);

create table if not exists spirit_configs (
  user_id                  uuid primary key references profiles(id) on delete cascade,
  morning_check_in_time    text not null default '08:00',
  evening_check_in_time    text not null default '20:00',
  do_not_disturb           boolean not null default false,
  created_at               timestamptz not null default now()
);

create table if not exists data_locker_settings (
  user_id    uuid primary key references profiles(id) on delete cascade,
  is_locked  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists user_xp (
  user_id uuid primary key references profiles(id) on delete cascade,
  xp      integer not null default 0,
  level   integer not null default 1,
  created_at timestamptz not null default now()
);

-- RLS on all of them
alter table village_wallets      enable row level security;
alter table hut_configs          enable row level security;
alter table spirit_configs       enable row level security;
alter table data_locker_settings enable row level security;
alter table user_xp              enable row level security;

drop policy if exists "own wallet"           on village_wallets;
drop policy if exists "own hut"              on hut_configs;
drop policy if exists "own spirit"           on spirit_configs;
drop policy if exists "own data_locker"      on data_locker_settings;
drop policy if exists "own xp"              on user_xp;

create policy "own wallet"      on village_wallets      for all using (auth.uid() = user_id);
create policy "own hut"         on hut_configs          for all using (auth.uid() = user_id);
create policy "own spirit"      on spirit_configs       for all using (auth.uid() = user_id);
create policy "own data_locker" on data_locker_settings for all using (auth.uid() = user_id);
create policy "own xp"         on user_xp              for all using (auth.uid() = user_id);

-- Redefine the trigger to be crash-safe with exception handling
create or replace function handle_new_user()
returns trigger as $$
declare
  _username text;
  _display  text;
begin
  _username := coalesce(NEW.raw_user_meta_data->>'username', 'villager_' || substr(NEW.id::text, 1, 8));
  _display  := coalesce(NEW.raw_user_meta_data->>'full_name', 'New Villager');

  insert into profiles (id, username, display_name)
  values (NEW.id, _username, _display)
  on conflict (id) do nothing;

  begin insert into village_wallets      (user_id) values (NEW.id) on conflict do nothing; exception when others then null; end;
  begin insert into hut_configs          (user_id) values (NEW.id) on conflict do nothing; exception when others then null; end;
  begin insert into spirit_configs       (user_id) values (NEW.id) on conflict do nothing; exception when others then null; end;
  begin insert into data_locker_settings (user_id) values (NEW.id) on conflict do nothing; exception when others then null; end;
  begin insert into user_xp              (user_id) values (NEW.id) on conflict do nothing; exception when others then null; end;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
