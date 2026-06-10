-- ============================================================
-- Migration 046: Fix infinite recursion in profiles RLS policy
-- ============================================================
-- Migration 005 added a "Super admins read all profiles" SELECT policy
-- that subqueries `profiles` from within its own policy on `profiles`,
-- causing Postgres error 42P17 "infinite recursion detected in policy
-- for relation profiles" on EVERY authenticated SELECT against profiles.
--
-- The schema already has `profiles_public_view` (USING (TRUE)), which
-- grants full SELECT access to everyone — making the super-admin policy
-- entirely redundant for SELECT. Drop it.

DROP POLICY IF EXISTS "Super admins read all profiles" ON profiles;
