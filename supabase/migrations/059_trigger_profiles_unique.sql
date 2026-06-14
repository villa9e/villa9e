-- Spaces Settings: trigger profile editors need to upsert one row per
-- (user, energy_type) from the client. Add the unique constraint that
-- onConflict upserts require.
ALTER TABLE trigger_profiles
  ADD CONSTRAINT trigger_profiles_user_energy_unique UNIQUE (user_id, energy_type);
