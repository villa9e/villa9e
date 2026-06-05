-- 043_all_missing_tables.sql
-- All remaining tables needed for full functionality
-- Covers: Saves, Office DMs, Tasks, Testimonials, Data Locker prefs, Saved content

-- Saved cards (Workshop + DreamLine saves)
CREATE TABLE IF NOT EXISTS saved_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  card_type TEXT NOT NULL, -- video|template|goal|post|content
  card_title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating SMALLINT DEFAULT 5,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (Spaces section)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending|in_progress|done
  due_date DATE,
  project_id UUID,
  priority TEXT DEFAULT 'normal', -- low|normal|high
  source TEXT DEFAULT 'manual', -- manual|spaces|office|workshop
  source_id UUID,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects (Spaces / Office)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  collaborator_ids JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data sharing preferences (Data Locker)
CREATE TABLE IF NOT EXISTS data_sharing_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  share_gps_goals BOOLEAN DEFAULT FALSE,
  share_content_engagement BOOLEAN DEFAULT FALSE,
  share_location BOOLEAN DEFAULT FALSE,
  share_wellness BOOLEAN DEFAULT FALSE,
  share_financial_behavior BOOLEAN DEFAULT FALSE,
  share_commerce_behavior BOOLEAN DEFAULT FALSE,
  share_social_graph BOOLEAN DEFAULT FALSE,
  share_goal_content_interests BOOLEAN DEFAULT FALSE,
  share_entertainment BOOLEAN DEFAULT FALSE,
  share_behavioral_patterns BOOLEAN DEFAULT FALSE,
  share_vlg_patterns BOOLEAN DEFAULT FALSE,
  share_communication_patterns BOOLEAN DEFAULT FALSE,
  payout_preference TEXT DEFAULT 'usd',
  data_minimization_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data access audit log
CREATE TABLE IF NOT EXISTS data_access_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accessor_type TEXT NOT NULL, -- village_internal|approved_buyer|spirit_ai|analytics
  accessor_name TEXT NOT NULL,
  data_category TEXT NOT NULL,
  access_purpose TEXT,
  legal_basis TEXT DEFAULT 'platform_operation',
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data earnings
CREATE TABLE IF NOT EXISTS data_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_usd NUMERIC(10,4) NOT NULL,
  categories_contributed TEXT[] DEFAULT '{}',
  payout_status TEXT DEFAULT 'pending',
  payout_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites / Bookmarks (unified)
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- post|video|template|store|deal|event
  item_id TEXT NOT NULL,
  item_title TEXT,
  item_thumbnail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- Post comments (unified)
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES dream_line_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  oowop_count INT DEFAULT 0,
  parent_id UUID REFERENCES post_comments(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story views tracking
ALTER TABLE stories ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS viewers JSONB DEFAULT '[]';

-- Profile enhancements
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS testimonial_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deal_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS success_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS link_in_bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronouns TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pinned_post_ids TEXT[] DEFAULT '{}';

-- Office messages enhancement
ALTER TABLE office_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE office_threads ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE office_threads ADD COLUMN IF NOT EXISTS unread_count INT DEFAULT 0;

-- RLS
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sharing_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_cards_own" ON saved_cards;
CREATE POLICY "saved_cards_own" ON saved_cards FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "testimonials_view" ON testimonials;
CREATE POLICY "testimonials_view" ON testimonials FOR SELECT USING (is_public = TRUE OR recipient_user_id = auth.uid() OR author_user_id = auth.uid());
DROP POLICY IF EXISTS "testimonials_write" ON testimonials;
CREATE POLICY "testimonials_write" ON testimonials FOR INSERT WITH CHECK (author_user_id = auth.uid());
DROP POLICY IF EXISTS "tasks_own" ON tasks;
CREATE POLICY "tasks_own" ON tasks FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "projects_own" ON projects;
CREATE POLICY "projects_own" ON projects FOR ALL USING (creator_id = auth.uid());
DROP POLICY IF EXISTS "data_prefs_own" ON data_sharing_preferences;
CREATE POLICY "data_prefs_own" ON data_sharing_preferences FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "data_audit_own" ON data_access_audit;
CREATE POLICY "data_audit_own" ON data_access_audit FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "data_earnings_own" ON data_earnings;
CREATE POLICY "data_earnings_own" ON data_earnings FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "favorites_own" ON user_favorites;
CREATE POLICY "favorites_own" ON user_favorites FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "post_comments_view" ON post_comments;
CREATE POLICY "post_comments_view" ON post_comments FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "post_comments_write" ON post_comments;
CREATE POLICY "post_comments_write" ON post_comments FOR INSERT WITH CHECK (user_id = auth.uid());

SELECT '043_all_missing_tables applied' AS result;
