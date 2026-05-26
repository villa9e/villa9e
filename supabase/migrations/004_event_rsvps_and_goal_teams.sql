-- ============================================================
-- VILLA9E MIGRATION 004 — Event RSVPs + Goal Team Columns
-- Run in Supabase SQL editor
-- ============================================================

-- Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id   UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id),
  status     TEXT NOT NULL DEFAULT 'going', -- going | maybe | declined
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own RSVPs" ON event_rsvps FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users RSVP to events" ON event_rsvps FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users cancel RSVPs" ON event_rsvps FOR DELETE USING (user_id = auth.uid());

-- Make calendar_events visible publicly for public event type
CREATE POLICY "Public events visible to all" ON calendar_events FOR SELECT USING (
  event_type = 'public' OR creator_id = auth.uid()
);

-- Goal team members: ensure status column exists
ALTER TABLE goal_team_members ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted';
-- pending | accepted | declined
