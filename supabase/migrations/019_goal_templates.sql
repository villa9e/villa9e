-- ── Goal Templates — villagers can share and clone goal plans ───────────────
CREATE TABLE IF NOT EXISTS goal_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id         UUID REFERENCES goals(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  estimated_weeks INTEGER DEFAULT 12,
  steps           JSONB DEFAULT '[]',
  sprints         JSONB DEFAULT '[]',
  skills_needed   TEXT[],
  success_metrics TEXT[],
  clone_count     INTEGER DEFAULT 0,
  oowop_count     INTEGER DEFAULT 0,
  is_public       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gt_category   ON goal_templates (category);
CREATE INDEX IF NOT EXISTS gt_clone_count ON goal_templates (clone_count DESC);
CREATE INDEX IF NOT EXISTS gt_creator    ON goal_templates (creator_id);

ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_public_read" ON goal_templates
  FOR SELECT USING (is_public = TRUE OR auth.uid() = creator_id);

CREATE POLICY "template_own_write" ON goal_templates
  FOR ALL USING (auth.uid() = creator_id);
