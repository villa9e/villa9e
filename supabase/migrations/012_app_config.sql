-- app_config: key-value store for all admin-editable content
CREATE TABLE IF NOT EXISTS app_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT 'null',
  label       TEXT NOT NULL DEFAULT '',
  section     TEXT NOT NULL DEFAULT 'general',
  type        TEXT NOT NULL DEFAULT 'text',   -- text | textarea | color | number | boolean | select
  options     JSONB DEFAULT NULL,              -- for select type: [{"label":"...","value":"..."}]
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id)
);

-- RLS: only service role (admin API) can write; anyone can read
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON app_config FOR SELECT USING (true);
CREATE POLICY "service write" ON app_config FOR ALL USING (true); -- enforced at API layer

-- ── Default seed values ────────────────────────────────────────────────────
INSERT INTO app_config (key, value, label, section, type) VALUES

  -- Brand
  ('brand.primary_color',     '"#1877F2"',     'Primary Color',           'brand',         'color'),
  ('brand.tagline',           '"It takes a village."', 'Tagline',          'brand',         'text'),
  ('brand.accent_color',      '"#E8770A"',     'Accent (Orange)',          'brand',         'color'),
  ('brand.night_fire_color',  '"#FF6B2B"',     'Night Fire Glow',         'brand',         'color'),

  -- Homepage content
  ('home.hero.title',       '"It takes a village to achieve your goals."',  'Hero Title',          'content', 'text'),
  ('home.hero.subtitle',    '"Set a goal. AI builds your plan. Your village validates every step. Progress is a community sport."', 'Hero Subtitle', 'content', 'textarea'),
  ('home.hero.cta_primary', '"🏡 Enter the Village"',                        'Primary CTA',         'content', 'text'),
  ('home.hero.cta_secondary','"Sign in →"',                                  'Secondary CTA',       'content', 'text'),
  ('home.founding.max',     '1000',                                           'Founding Villager Limit', 'content', 'number'),
  ('home.founding.bonus',   '500',                                            'Founding Villager Bonus ($VLG)', 'content', 'number'),

  -- Village rules
  ('village.vlg_per_goal_step',  '25',   '$VLG per goal step completed',  'village', 'number'),
  ('village.vlg_per_oowop',      '10',   '$VLG per OoWop given',          'village', 'number'),
  ('village.vlg_per_checkin',    '10',   '$VLG per Spirit check-in',      'village', 'number'),
  ('village.vlg_per_referral',   '100',  '$VLG per referral',             'village', 'number'),
  ('village.vlg_onboarding',     '50',   '$VLG for completing onboarding','village', 'number'),
  ('village.score_oowop_weight', '1.5',  'OoWop score multiplier',        'village', 'number'),

  -- Spirit AI
  ('spirit.greeting_style', '"warm"',          'Greeting Style',  'spirit', 'select'),
  ('spirit.max_tokens',     '600',             'Max Response Tokens', 'spirit', 'number'),
  ('spirit.checkin_question_morning', '"What is the ONE thing you must do today to move your most important goal forward?"',
   'Morning Check-In Prompt', 'spirit', 'textarea'),
  ('spirit.checkin_question_evening', '"What did you actually accomplish today — and what got in the way?"',
   'Evening Check-In Prompt', 'spirit', 'textarea'),

  -- Announcements
  ('announcements.banner_text',  'null',       'Site-wide Banner Text (null = hidden)', 'announcements', 'textarea'),
  ('announcements.banner_color', '"#1877F2"',  'Banner Background Color',               'announcements', 'color'),
  ('announcements.banner_link',  'null',        'Banner Link URL',                       'announcements', 'text')

ON CONFLICT (key) DO NOTHING;
