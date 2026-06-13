-- ============================================================
-- Migration 053: Spirit OS — memory graph + action audit log
-- ============================================================
-- Phase 1 of SPIRIT_OS_SPEC.md ("Spirit hard-wired to everything").
-- Adds a relational memory graph (entities + relationships) so Spirit
-- can reason about how goals/sprints/events/people/preferences connect,
-- on top of the existing flat `spirit_memories` log. Also adds
-- `spirit_actions`, the audit trail for anything Spirit does via the
-- upcoming tool-use layer (Phase 2/3).

CREATE TABLE IF NOT EXISTS spirit_entities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,              -- goal | sprint | action | event | person | place | preference
  label       text NOT NULL,
  data        jsonb DEFAULT '{}'::jsonb,  -- arbitrary structured detail for this entity
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spirit_entities_user_idx ON spirit_entities (user_id, type);

CREATE TABLE IF NOT EXISTS spirit_relationships (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_entity   uuid NOT NULL REFERENCES spirit_entities(id) ON DELETE CASCADE,
  to_entity     uuid NOT NULL REFERENCES spirit_entities(id) ON DELETE CASCADE,
  relation      text NOT NULL,            -- e.g. BLOCKS, RELATES_TO, PART_OF, CONFLICTS_WITH
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spirit_relationships_user_idx ON spirit_relationships (user_id);
CREATE INDEX IF NOT EXISTS spirit_relationships_from_idx ON spirit_relationships (from_entity);
CREATE INDEX IF NOT EXISTS spirit_relationships_to_idx ON spirit_relationships (to_entity);

-- Audit trail for everything Spirit does via tool use (Phase 2/3).
-- tier: 0 = read-only, 1 = reversible in-app action, 2 = irreversible/external,
-- requires explicit confirmation before `confirmed_at` is set.
CREATE TABLE IF NOT EXISTS spirit_actions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name     text NOT NULL,
  tier          smallint NOT NULL DEFAULT 0,
  input         jsonb DEFAULT '{}'::jsonb,
  result        jsonb DEFAULT '{}'::jsonb,
  status        text NOT NULL DEFAULT 'completed', -- pending_confirmation | completed | rejected | failed
  confirmed_at  timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spirit_actions_user_idx ON spirit_actions (user_id, created_at DESC);

ALTER TABLE spirit_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE spirit_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE spirit_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own entities" ON spirit_entities;
CREATE POLICY "own entities" ON spirit_entities
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own relationships" ON spirit_relationships;
CREATE POLICY "own relationships" ON spirit_relationships
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own actions select" ON spirit_actions;
DROP POLICY IF EXISTS "own actions update" ON spirit_actions;
CREATE POLICY "own actions select" ON spirit_actions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own actions update" ON spirit_actions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Inserts come from the server (service role) via the tool-use loop, not the client.

NOTIFY pgrst, 'reload schema';
