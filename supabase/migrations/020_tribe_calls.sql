-- ─── Tribe call sessions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS call_sessions (
  id            TEXT PRIMARY KEY,
  caller_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  callee_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caller_name   TEXT,
  status        TEXT NOT NULL DEFAULT 'ringing'
                  CHECK (status IN ('ringing','active','ended','declined','missed')),
  started_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ,
  duration_secs INT GENERATED ALWAYS AS (
    CASE WHEN started_at IS NOT NULL AND ended_at IS NOT NULL
         THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INT
         ELSE NULL END
  ) STORED,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_own_view" ON call_sessions FOR SELECT
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

CREATE POLICY "call_own_insert" ON call_sessions FOR INSERT
  WITH CHECK (caller_id = auth.uid());

CREATE POLICY "call_own_update" ON call_sessions FOR UPDATE
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

-- ─── Collaborative goals (tribe member projects) ──────────────────────────────
CREATE TABLE IF NOT EXISTS collaborative_goals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id     UUID REFERENCES goals(id) ON DELETE CASCADE,
  creator_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','active','completed','cancelled')),
  can_cancel  BOOLEAN DEFAULT TRUE,
  terms       JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE collaborative_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collab_view" ON collaborative_goals FOR SELECT
  USING (creator_id = auth.uid() OR partner_id = auth.uid());

CREATE POLICY "collab_insert" ON collaborative_goals FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "collab_update" ON collaborative_goals FOR UPDATE
  USING (creator_id = auth.uid() OR partner_id = auth.uid());

-- ─── User blocks ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks_own" ON user_blocks FOR ALL
  USING (blocker_id = auth.uid());

-- ─── Tribe member village positions (persistent avatar placement) ─────────────
CREATE TABLE IF NOT EXISTS tribe_member_village_positions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pos_x       FLOAT DEFAULT 0,
  pos_z       FLOAT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, member_id)
);

ALTER TABLE tribe_member_village_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "village_pos_view" ON tribe_member_village_positions FOR SELECT
  USING (owner_id = auth.uid() OR member_id = auth.uid());

CREATE POLICY "village_pos_owner" ON tribe_member_village_positions FOR ALL
  USING (owner_id = auth.uid());
