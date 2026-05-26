-- ============================================================
-- Migration 005: Super Admin Role + Admin User Creation
-- ============================================================

-- Add super_admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Create admin user function (bypasses auth API trigger issues)
CREATE OR REPLACE FUNCTION create_admin_user_if_not_exists()
RETURNS void AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO _user_id FROM auth.users WHERE email = 'admin@villa9e.app';

  IF _user_id IS NULL THEN
    -- Generate a stable UUID for the admin
    _user_id := gen_random_uuid();

    -- Insert directly into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      _user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@villa9e.app',
      crypt('Jupiter2433!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"villa9e_admin","full_name":"Villa9e Admin"}',
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );

    -- Create profile
    INSERT INTO profiles (id, username, display_name, onboarding_complete, is_super_admin, email_verified)
    VALUES (_user_id, 'villa9e_admin', 'Villa9e Admin', TRUE, TRUE, TRUE)
    ON CONFLICT (id) DO UPDATE SET is_super_admin = TRUE, onboarding_complete = TRUE;

    -- Create wallet and config rows (safe inserts)
    INSERT INTO village_wallets (user_id) VALUES (_user_id) ON CONFLICT DO NOTHING;
    INSERT INTO hut_configs (user_id) VALUES (_user_id) ON CONFLICT DO NOTHING;
    INSERT INTO spirit_configs (user_id) VALUES (_user_id) ON CONFLICT DO NOTHING;
    INSERT INTO data_locker_settings (user_id) VALUES (_user_id) ON CONFLICT DO NOTHING;
    INSERT INTO user_xp (user_id) VALUES (_user_id) ON CONFLICT DO NOTHING;
  ELSE
    -- User exists — just ensure super_admin is set
    UPDATE profiles SET is_super_admin = TRUE, onboarding_complete = TRUE
    WHERE id = _user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run it
SELECT create_admin_user_if_not_exists();

-- Clean up the function
DROP FUNCTION create_admin_user_if_not_exists();

-- Update admin page to allow admin@villa9e.app in addition to elitehousemusic@gmail.com
-- (handled in code via is_super_admin check)

-- RLS: super admins can read everything (drop first to avoid duplicate)
DROP POLICY IF EXISTS "Super admins read all profiles" ON profiles;
CREATE POLICY "Super admins read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_super_admin = TRUE)
    OR auth.uid() = id
  );
