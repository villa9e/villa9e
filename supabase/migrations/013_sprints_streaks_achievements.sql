-- ── Sprints ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sprints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id         UUID REFERENCES goals(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  focus_intention TEXT,
  week_start      DATE NOT NULL DEFAULT CURRENT_DATE,
  week_end        DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '6 days'),
  status          TEXT NOT NULL DEFAULT 'active', -- active | completed | missed
  spirit_note     TEXT,  -- Spirit's end-of-sprint reflection
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sprint_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id       UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  goal_step_id    UUID REFERENCES goal_steps(id),
  title           TEXT NOT NULL,
  day_of_week     INTEGER,   -- 1=Mon … 7=Sun, null = anytime this week
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE sprints       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sprints"        ON sprints        USING (auth.uid() = user_id);
CREATE POLICY "own sprint actions" ON sprint_actions USING (
  sprint_id IN (SELECT id FROM sprints WHERE user_id = auth.uid())
);

-- ── Streak columns on profiles ────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS checkin_streak   INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak   INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_checkin_date DATE;

-- ── Spirit memory full-text search ───────────────────────────────────────
ALTER TABLE spirit_memories ADD COLUMN IF NOT EXISTS content_tsv TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', COALESCE(content, ''))) STORED;
CREATE INDEX IF NOT EXISTS spirit_memories_fts ON spirit_memories USING GIN (content_tsv);

-- ── Achievements ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  category    TEXT NOT NULL,
  points      INTEGER DEFAULT 0,
  rarity      TEXT DEFAULT 'common'  -- common | rare | epic | legendary
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  earned_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own achievements" ON user_achievements USING (auth.uid() = user_id);

-- Seed achievement definitions
INSERT INTO achievements (id, title, description, icon, category, points, rarity) VALUES
  ('first_goal',      'Pioneer',        'Set your first goal',                 '🎯', 'goals',     50,   'common'),
  ('goals_10',        'Goal Setter',    'Set 10 goals',                        '🏹', 'goals',     150,  'rare'),
  ('first_complete',  'Finisher',       'Complete your first goal',            '🏆', 'goals',     250,  'rare'),
  ('goals_3_done',    'Triple Threat',  'Complete 3 goals',                    '⚡', 'goals',     500,  'epic'),
  ('streak_3',        'On a Roll',      'Check in 3 days in a row',            '🔥', 'habits',    50,   'common'),
  ('streak_7',        '7-Day Streak',   'Check in 7 days in a row',            '🔥', 'habits',    150,  'rare'),
  ('streak_30',       '30-Day Streak',  'Check in 30 days in a row',           '🌟', 'habits',    500,  'epic'),
  ('streak_100',      'Century',        'Check in 100 days in a row',          '💎', 'habits',   1000,  'legendary'),
  ('first_oowop',     'Validator',      'Give your first OoWop',               '✊', 'community',  25,  'common'),
  ('oowop_10',        'Supporter',      'Give 10 OoWops',                      '🤜', 'community', 100,  'rare'),
  ('oowop_50',        'Village Voice',  'Give 50 OoWops',                      '📣', 'community', 300,  'epic'),
  ('oowop_100',       'Village Elder',  'Give 100 OoWops',                     '👑', 'community', 600,  'epic'),
  ('first_referral',  'Recruiter',      'Invite your first villager',          '🤝', 'growth',    100,  'common'),
  ('referral_5',      'Connector',      'Invite 5 villagers',                  '🌐', 'growth',    300,  'rare'),
  ('referral_10',     'Village Builder','Invite 10 villagers',                 '🏗️', 'growth',    600,  'epic'),
  ('first_tribe',     'Tribe Member',   'Join your first tribe',               '👥', 'community',  50,  'common'),
  ('spirit_10',       'Spirit Friend',  'Have 10 conversations with Spirit',   '🌿', 'spirit',    100,  'common'),
  ('archetype_set',   'Self-Aware',     'Discover your archetype',             '🧭', 'spirit',     75,  'common'),
  ('first_sprint',    'Sprinter',       'Complete your first weekly sprint',   '⚡', 'goals',     150,  'rare'),
  ('sprint_streak_4', 'Momentum',       'Complete 4 weekly sprints in a row',  '🚀', 'goals',     400,  'epic'),
  ('first_checkin',   'Present',        'Complete your first Spirit check-in', '✅', 'habits',     25,  'common'),
  ('founding',        'Founding Villager','One of the first 1,000 villagers',  '🏕️', 'special',  500,  'legendary')
ON CONFLICT (id) DO NOTHING;
