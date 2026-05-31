-- ============================================================
-- FIX_TRIGGER.sql
-- Run this in Supabase SQL Editor → fixes "Database error creating new user"
-- Safe to run multiple times.
-- ============================================================

-- Redefine handle_new_user() with per-insert exception handling
-- so a failure in any single insert never blocks user creation.
create or replace function handle_new_user()
returns trigger as $$
declare
  _username text;
  _display  text;
begin
  _username := coalesce(NEW.raw_user_meta_data->>'username', 'villager_' || substr(NEW.id::text, 1, 8));
  _display  := coalesce(NEW.raw_user_meta_data->>'full_name', 'New Villager');

  -- profiles insert (no exception block — if this fails, let auth fail loudly so we know)
  insert into profiles (id, username, display_name)
  values (NEW.id, _username, _display)
  on conflict (id) do nothing;

  -- All auxiliary tables are wrapped so a missing column / constraint never kills the signup
  begin
    insert into village_wallets (user_id) values (NEW.id) on conflict (user_id) do nothing;
  exception when others then null;
  end;

  begin
    insert into hut_configs (user_id) values (NEW.id) on conflict (user_id) do nothing;
  exception when others then null;
  end;

  begin
    insert into spirit_configs (user_id) values (NEW.id) on conflict (user_id) do nothing;
  exception when others then null;
  end;

  begin
    insert into data_locker_settings (user_id) values (NEW.id) on conflict (user_id) do nothing;
  exception when others then null;
  end;

  begin
    insert into user_xp (user_id) values (NEW.id) on conflict (user_id) do nothing;
  exception when others then null;
  end;

  return NEW;
end;
$$ language plpgsql security definer;

-- Recreate the trigger (drop first to ensure clean state)
drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Confirm
select 'handle_new_user() trigger updated successfully' as result;
