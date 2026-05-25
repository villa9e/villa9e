-- ============================================================
-- VILLA9E APP — COMPLETE DATABASE SCHEMA
-- Powered by Legaci Jackson | villa9e.app
-- Database: Supabase (PostgreSQL 15)
-- Version: 1.0 — Phase 1 MVP
-- Brand: Royal Blue #1877F2 | White #FFFFFF
-- OoWop (not OoWhop) — villa9e proprietary term
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUMS
DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male','female','non_binary','other','prefer_not_to_say');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE skill_rating AS ENUM ('pain_point','neutral','skillset');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE goal_status AS ENUM ('draft','active','paused','completed','abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE goal_type AS ENUM ('short_term','long_term');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE step_status AS ENUM ('pending','in_progress','completed','skipped','blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE financing_type AS ENUM ('self_fund','fundraise','village_financing','compound_investing','accredited_investor','micro_trust');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE medal_type AS ENUM ('bronze','silver','gold','platinum');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE deal_type AS ENUM ('trade','network','pay');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE deal_status AS ENUM ('pending','accepted','declined','negotiating','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('oowop','match','message','goal_step','medal','deal','tribe_invite','mindful_moment','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE personality_type AS ENUM ('architect','spark','anchor','compass','pioneer','sage','weaver','flame');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE tribe_role AS ENUM ('founder','admin','contributor','observer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE post_visibility AS ENUM ('public','tribe','anonymous','private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE data_consent AS ENUM ('locked','anonymous_only','full_monetization');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE zen_mood AS ENUM ('great','good','neutral','low','very_low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE wellness_category AS ENUM ('meditation','prayer','affirmation','exercise','telehealth','alternative_healing','spiritual_knowledge','divination','journaling','biometric_check');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('sent','delivered','read');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username              TEXT UNIQUE NOT NULL,
  display_name          TEXT,
  bio                   TEXT,
  avatar_url            TEXT,
  avatar_glb_url        TEXT,
  gender                gender_type,
  date_of_birth         DATE,
  location_city         TEXT,
  location_country      TEXT,
  location_lat          DECIMAL(10,7),
  location_lng          DECIMAL(10,7),
  language              TEXT DEFAULT 'en',
  occupation            TEXT,
  education_level       TEXT,
  communication_style   TEXT,
  phone_number          TEXT,
  phone_verified        BOOLEAN DEFAULT FALSE,
  email_verified        BOOLEAN DEFAULT FALSE,
  onboarding_complete   BOOLEAN DEFAULT FALSE,
  onboarding_step       INT DEFAULT 0,
  personality_type      personality_type,
  village_score         INT DEFAULT 0,
  force_rate            DECIMAL(5,2) DEFAULT 0.00,
  success_ratio         DECIMAL(5,2) DEFAULT 0.00,
  data_consent          data_consent DEFAULT 'locked',
  data_earnings_total   DECIMAL(12,2) DEFAULT 0.00,
  vlg_balance           DECIMAL(18,8) DEFAULT 0.00,
  nebu_balance          DECIMAL(18,8) DEFAULT 0.00,
  tribe_balance         DECIMAL(18,8) DEFAULT 0.00,
  wallet_address        TEXT,
  stripe_customer_id    TEXT,
  is_verified           BOOLEAN DEFAULT FALSE,
  is_creator            BOOLEAN DEFAULT FALSE,
  is_minor              BOOLEAN DEFAULT FALSE,
  parental_consent_email TEXT,
  parental_consent_verified BOOLEAN DEFAULT FALSE,
  parental_consent_at   TIMESTAMPTZ,
  is_founding_villager  BOOLEAN DEFAULT FALSE,
  founding_villager_number INT,
  is_banned             BOOLEAN DEFAULT FALSE,
  last_active_at        TIMESTAMPTZ DEFAULT NOW(),
  mindful_moment_done   BOOLEAN DEFAULT FALSE,
  last_mindful_date     DATE,
  score_tier            TEXT DEFAULT 'seedling',
  score_multiplier      DECIMAL(4,2) DEFAULT 1.00,
  streak_days           INT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- ============================================================
-- 2. SPIRIT CONFIGURATION
-- ============================================================
CREATE TABLE IF NOT EXISTS spirit_configs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spiritual_system      TEXT DEFAULT 'Secular',
  topics                TEXT[],
  coaching_tone         TEXT DEFAULT 'encouraging',
  do_not_disturb        BOOLEAN DEFAULT FALSE,
  dnd_in_zen_space      BOOLEAN DEFAULT TRUE,
  morning_check_in_time TIME DEFAULT '08:00',
  evening_check_in_time TIME DEFAULT '20:00',
  language              TEXT DEFAULT 'en',
  values                TEXT[],
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 3. HUT CONFIGURATION
-- ============================================================
CREATE TABLE IF NOT EXISTS hut_configs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme                 TEXT DEFAULT 'classic',
  custom_items          JSONB DEFAULT '[]',
  background_color      TEXT DEFAULT '#1877F2',
  is_public             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 4. SKILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS skills (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT UNIQUE NOT NULL,
  category              TEXT NOT NULL,
  subcategory           TEXT,
  description           TEXT,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_skills (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id              UUID REFERENCES skills(id),
  skill_name            TEXT NOT NULL,
  rating                INT NOT NULL CHECK (rating BETWEEN 1 AND 9),
  rating_category       TEXT GENERATED ALWAYS AS (
    CASE WHEN rating BETWEEN 1 AND 3 THEN 'pain_point'
         WHEN rating BETWEEN 4 AND 6 THEN 'neutral'
         ELSE 'skillset' END
  ) STORED,
  years_experience      INT DEFAULT 0,
  is_monetizable        BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. USER PROFILE DEPTH TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_interests (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest  TEXT NOT NULL,
  category  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_restrictions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restriction      TEXT NOT NULL,
  restriction_type TEXT,
  is_trigger       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_intentions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  intention       TEXT NOT NULL,
  category        TEXT,
  is_transcendence BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. GOALS (GPS ENGINE CORE)
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  description           TEXT,
  goal_type             goal_type,
  status                goal_status DEFAULT 'draft',
  category              TEXT,
  is_smart              BOOLEAN DEFAULT FALSE,
  is_transcendence      BOOLEAN DEFAULT FALSE,
  is_public             BOOLEAN DEFAULT TRUE,
  is_anonymous          BOOLEAN DEFAULT FALSE,
  start_date            DATE,
  target_date           DATE,
  completed_date        DATE,
  estimated_weeks       INT,
  weekly_hours          INT DEFAULT 5,
  probability_score     DECIMAL(5,2) DEFAULT 0.00,
  progress_percentage   DECIMAL(5,2) DEFAULT 0.00,
  current_step_index    INT DEFAULT 0,
  total_steps           INT DEFAULT 0,
  medal                 medal_type,
  ai_analysis           JSONB DEFAULT '{}',
  ai_resources          JSONB DEFAULT '[]',
  ai_people_roles       JSONB DEFAULT '[]',
  template_id           UUID,
  is_template           BOOLEAN DEFAULT FALSE,
  template_use_count    INT DEFAULT 0,
  embedding             vector(1536),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_steps (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id               UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step_number           INT NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT,
  status                step_status DEFAULT 'pending',
  due_date              DATE,
  completed_date        TIMESTAMPTZ,
  estimated_hours       DECIMAL(5,2),
  actual_hours          DECIMAL(5,2),
  resource_category     TEXT,
  required_skill        TEXT,
  requires_trade        BOOLEAN DEFAULT FALSE,
  google_calendar_event_id TEXT,
  oowops_needed         INT DEFAULT 3,
  oowops_received       INT DEFAULT 0,
  is_validated          BOOLEAN DEFAULT FALSE,
  ai_notes              TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_resources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id         UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  step_id         UUID REFERENCES goal_steps(id),
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  estimated_cost  DECIMAL(12,2) DEFAULT 0.00,
  actual_cost     DECIMAL(12,2),
  currency        TEXT DEFAULT 'USD',
  quantity        INT DEFAULT 1,
  is_purchased    BOOLEAN DEFAULT FALSE,
  purchased_at    TIMESTAMPTZ,
  ai_suggested    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_team_members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id           UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by        UUID NOT NULL REFERENCES profiles(id),
  role              TEXT NOT NULL,
  skill_contribution TEXT,
  status            TEXT DEFAULT 'invited',
  joined_at         TIMESTAMPTZ,
  contribution_score DECIMAL(5,2) DEFAULT 0.00,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_probability_log (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id   UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  score     DECIMAL(5,2) NOT NULL,
  factors   JSONB,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id    UUID NOT NULL REFERENCES profiles(id),
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  steps         JSONB NOT NULL,
  resources     JSONB DEFAULT '[]',
  roles_needed  JSONB DEFAULT '[]',
  estimated_cost DECIMAL(12,2),
  estimated_weeks INT,
  success_rate  DECIMAL(5,2) DEFAULT 0.00,
  use_count     INT DEFAULT 0,
  rating        DECIMAL(3,2) DEFAULT 0.00,
  is_approved   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. DREAM LINE
-- ============================================================
CREATE TABLE IF NOT EXISTS dream_line_posts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id               UUID REFERENCES goals(id),
  step_id               UUID REFERENCES goal_steps(id),
  content               TEXT NOT NULL,
  visibility            post_visibility DEFAULT 'public',
  media_urls            TEXT[] DEFAULT '{}',
  media_types           TEXT[] DEFAULT '{}',
  tags                  TEXT[] DEFAULT '{}',
  goal_category         TEXT,
  oowop_count           INT DEFAULT 0,
  comment_count         INT DEFAULT 0,
  view_count            INT DEFAULT 0,
  is_milestone          BOOLEAN DEFAULT FALSE,
  milestone_type        TEXT,
  is_validated          BOOLEAN DEFAULT FALSE,
  medal_at_post         medal_type,
  ai_quality_score      DECIMAL(3,2),
  distribution_boost    DECIMAL(4,2) DEFAULT 1.00,
  embedding             vector(1536),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- OoWops (villa9e social validation — OoWop not OoWhop)
CREATE TABLE IF NOT EXISTS oowops (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id               UUID NOT NULL REFERENCES dream_line_posts(id) ON DELETE CASCADE,
  giver_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id           UUID NOT NULL REFERENCES profiles(id),
  goal_id               UUID REFERENCES goals(id),
  step_id               UUID REFERENCES goal_steps(id),
  giver_relevance_score DECIMAL(3,2),
  giver_multiplier      DECIMAL(4,2) DEFAULT 1.00,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, giver_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id             UUID NOT NULL REFERENCES dream_line_posts(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id   UUID REFERENCES post_comments(id),
  content             TEXT NOT NULL,
  is_advice           BOOLEAN DEFAULT TRUE,
  advice_quality_score DECIMAL(3,2) DEFAULT 0.00,
  is_flagged          BOOLEAN DEFAULT FALSE,
  is_hidden           BOOLEAN DEFAULT FALSE,
  helpful_votes       INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. MATCHING
-- ============================================================
CREATE TABLE IF NOT EXISTS villager_matches (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matched_user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id               UUID REFERENCES goals(id),
  match_score           DECIMAL(5,2) NOT NULL,
  transcendence_score   DECIMAL(5,2),
  skill_gap_score       DECIMAL(5,2),
  restriction_score     DECIMAL(5,2),
  interest_score        DECIMAL(5,2),
  personality_score     DECIMAL(5,2),
  match_reason          TEXT,
  roles_matched         JSONB,
  is_dismissed          BOOLEAN DEFAULT FALSE,
  is_connected          BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, matched_user_id, goal_id)
);

CREATE TABLE IF NOT EXISTS connections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        TEXT DEFAULT 'pending',
  message       TEXT,
  connected_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- ============================================================
-- 9. TRADING POST
-- ============================================================
CREATE TABLE IF NOT EXISTS trading_post_listings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  skill_offered    TEXT NOT NULL,
  category         TEXT,
  deal_types       TEXT[] DEFAULT '{trade,pay}',
  hourly_rate      DECIMAL(10,2),
  project_rate     DECIMAL(10,2),
  currency         TEXT DEFAULT 'USD',
  accepts_vlg      BOOLEAN DEFAULT TRUE,
  trade_for        TEXT[],
  portfolio_urls   TEXT[] DEFAULT '{}',
  availability     TEXT,
  turnaround_days  INT,
  max_active_deals INT DEFAULT 5,
  active_deal_count INT DEFAULT 0,
  is_active        BOOLEAN DEFAULT TRUE,
  review_count     INT DEFAULT 0,
  average_rating   DECIMAL(3,2) DEFAULT 0.00,
  embedding        vector(1536),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id            UUID REFERENCES trading_post_listings(id),
  goal_id               UUID REFERENCES goals(id),
  step_id               UUID REFERENCES goal_steps(id),
  deal_type             deal_type NOT NULL,
  status                deal_status DEFAULT 'pending',
  request_description   TEXT NOT NULL,
  trade_offer           TEXT,
  pay_amount            DECIMAL(10,2),
  pay_currency          TEXT DEFAULT 'USD',
  pay_in_vlg            BOOLEAN DEFAULT FALSE,
  required_skill        TEXT,
  required_time_hours   INT,
  prospective_outcome   TEXT,
  ai_equal_trade_score  DECIMAL(3,2),
  ai_suggested_type     deal_type,
  stripe_payment_id     TEXT,
  agreement_doc_url     TEXT,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trading_reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deal_id, reviewer_id)
);

-- ============================================================
-- 10. TRIBES
-- ============================================================
CREATE TABLE IF NOT EXISTS tribes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  description       TEXT,
  goal_id           UUID REFERENCES goals(id),
  creator_id        UUID NOT NULL REFERENCES profiles(id),
  cover_image_url   TEXT,
  is_public         BOOLEAN DEFAULT FALSE,
  is_micro_business BOOLEAN DEFAULT FALSE,
  business_name     TEXT,
  member_count      INT DEFAULT 1,
  max_members       INT DEFAULT 20,
  project_status    TEXT DEFAULT 'active',
  kanban_config     JSONB DEFAULT '{}',
  agreement_doc_url TEXT,
  virtual_space_id  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tribe_members (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tribe_id            UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role                tribe_role DEFAULT 'contributor',
  skills_contributed  TEXT[],
  tasks_assigned      INT DEFAULT 0,
  tasks_completed     INT DEFAULT 0,
  hours_contributed   DECIMAL(8,2) DEFAULT 0.00,
  force_rate          DECIMAL(5,2) DEFAULT 0.00,
  contribution_score  DECIMAL(5,2) DEFAULT 0.00,
  evaluation_score    DECIMAL(5,2) DEFAULT 0.00,
  joined_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tribe_id, user_id)
);

CREATE TABLE IF NOT EXISTS tribe_tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tribe_id      UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
  goal_step_id  UUID REFERENCES goal_steps(id),
  assigned_to   UUID REFERENCES profiles(id),
  created_by    UUID NOT NULL REFERENCES profiles(id),
  title         TEXT NOT NULL,
  description   TEXT,
  status        step_status DEFAULT 'pending',
  priority      TEXT DEFAULT 'medium',
  due_date      DATE,
  completed_at  TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours  DECIMAL(5,2),
  kanban_column TEXT DEFAULT 'backlog',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. ZEN SPACE
-- ============================================================
CREATE TABLE IF NOT EXISTS mindful_moments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type      TEXT DEFAULT 'morning',
  mood              zen_mood,
  mood_score        INT CHECK (mood_score BETWEEN 1 AND 10),
  energy_level      INT CHECK (energy_level BETWEEN 1 AND 10),
  focus_area        TEXT,
  today_intentions  TEXT,
  triggers_experienced TEXT,
  gratitude_note    TEXT,
  heart_rate        INT,
  blood_oxygen      DECIMAL(4,1),
  sleep_hours       DECIMAL(3,1),
  step_count        INT,
  stress_score      INT,
  app_route         TEXT,
  spirit_response   TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zen_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category            wellness_category NOT NULL,
  theme               TEXT,
  duration_minutes    INT,
  mood_before         zen_mood,
  mood_after          zen_mood,
  notes               TEXT,
  spirit_guidance     TEXT,
  spotify_playlist_id TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT,
  content         TEXT NOT NULL,
  mood            zen_mood,
  tags            TEXT[] DEFAULT '{}',
  ai_prompt_used  TEXT,
  is_private      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. SPACES (Smart Calendar)
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  location        TEXT,
  video_link      TEXT,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  all_day         BOOLEAN DEFAULT FALSE,
  timezone        TEXT DEFAULT 'America/Los_Angeles',
  goal_id         UUID REFERENCES goals(id),
  step_id         UUID REFERENCES goal_steps(id),
  tribe_id        UUID REFERENCES tribes(id),
  is_recurring    BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  google_event_id TEXT,
  event_type      TEXT DEFAULT 'goal_step',
  is_public       BOOLEAN DEFAULT FALSE,
  ticket_price    DECIMAL(10,2),
  max_attendees   INT,
  agenda          JSONB DEFAULT '[]',
  roles           JSONB DEFAULT '[]',
  budget          DECIMAL(10,2),
  weather_data    JSONB,
  ai_prep_notes   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_attendees (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rsvp_status TEXT DEFAULT 'pending',
  role        TEXT,
  duties      TEXT[],
  checked_in  BOOLEAN DEFAULT FALSE,
  eta_minutes INT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================================
-- 13. BANKING & WALLET
-- ============================================================
CREATE TABLE IF NOT EXISTS village_wallets (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vlg_balance         DECIMAL(18,8) DEFAULT 0.00,
  nebu_balance        DECIMAL(18,8) DEFAULT 0.00,
  tribe_balance       DECIMAL(18,8) DEFAULT 0.00,
  usd_balance         DECIMAL(12,2) DEFAULT 0.00,
  total_earned_vlg    DECIMAL(18,8) DEFAULT 0.00,
  total_earned_usd    DECIMAL(12,2) DEFAULT 0.00,
  total_data_earnings DECIMAL(12,2) DEFAULT 0.00,
  plaid_connected     BOOLEAN DEFAULT FALSE,
  plaid_institution   TEXT,
  plaid_account_mask  TEXT,
  bank_verified       BOOLEAN DEFAULT FALSE,
  stripe_customer_id  TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id             UUID NOT NULL REFERENCES village_wallets(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES profiles(id),
  transaction_type      TEXT NOT NULL,
  token_type            TEXT NOT NULL,
  amount                DECIMAL(18,8) NOT NULL,
  direction             TEXT NOT NULL,
  balance_after         DECIMAL(18,8) NOT NULL,
  reference_id          UUID,
  reference_type        TEXT,
  description           TEXT,
  stripe_transaction_id TEXT,
  polygon_tx_hash       TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crowdfunding_campaigns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id         UUID REFERENCES goals(id),
  title           TEXT NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  target_amount   DECIMAL(12,2) NOT NULL,
  raised_amount   DECIMAL(12,2) DEFAULT 0.00,
  currency        TEXT DEFAULT 'USD',
  deadline        DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  is_funded       BOOLEAN DEFAULT FALSE,
  backer_count    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. MESSAGING
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_type     TEXT DEFAULT 'direct',
  reference_id          UUID,
  participant_ids       UUID[] NOT NULL,
  last_message_at       TIMESTAMPTZ,
  last_message_preview  TEXT,
  unread_counts         JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT,
  media_url       TEXT,
  media_type      TEXT,
  status          message_status DEFAULT 'sent',
  is_deleted      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  reference_id    UUID,
  reference_type  TEXT,
  is_read         BOOLEAN DEFAULT FALSE,
  is_push_sent    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. GAMIFICATION
-- ============================================================
CREATE TABLE IF NOT EXISTS village_score_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score_change  INT NOT NULL,
  vlg_earned    DECIMAL(18,8) DEFAULT 0.00,
  new_score     INT NOT NULL,
  reason        TEXT NOT NULL,
  reference_id  UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_xp (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp          INT DEFAULT 0,
  current_level     INT DEFAULT 1,
  xp_to_next_level  INT DEFAULT 100,
  streak_days       INT DEFAULT 0,
  longest_streak    INT DEFAULT 0,
  last_activity_date DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS user_medals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id     UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  medal_type  medal_type NOT NULL,
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, goal_id, medal_type)
);

-- ============================================================
-- 17. FOUNDING VILLAGER COUNTER
-- ============================================================
CREATE TABLE IF NOT EXISTS founding_villager_counter (
  id          INT PRIMARY KEY DEFAULT 1,
  count       INT DEFAULT 0,
  max_count   INT DEFAULT 1000,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO founding_villager_counter (id, count, max_count) VALUES (1, 0, 1000) ON CONFLICT DO NOTHING;

-- ============================================================
-- 18. TRENDING GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS trending_goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category      TEXT NOT NULL,
  trend_source  TEXT NOT NULL,
  search_volume INT,
  region        TEXT DEFAULT 'us',
  trending_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- ============================================================
-- 19. DATA LOCKER
-- ============================================================
CREATE TABLE IF NOT EXISTS data_locker_settings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_level     data_consent DEFAULT 'locked',
  share_goals       BOOLEAN DEFAULT FALSE,
  share_health      BOOLEAN DEFAULT FALSE,
  share_behavior    BOOLEAN DEFAULT FALSE,
  share_purchases   BOOLEAN DEFAULT FALSE,
  share_location    BOOLEAN DEFAULT FALSE,
  share_interests   BOOLEAN DEFAULT FALSE,
  monthly_earnings  DECIMAL(10,2) DEFAULT 0.00,
  total_earnings    DECIMAL(10,2) DEFAULT 0.00,
  apps_with_access  JSONB DEFAULT '[]',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_village_score ON profiles(village_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_score_tier ON profiles(score_tier);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goal_steps_goal_id ON goal_steps(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_steps_status ON goal_steps(status);
CREATE INDEX IF NOT EXISTS idx_goal_steps_resource_category ON goal_steps(resource_category);
CREATE INDEX IF NOT EXISTS idx_dream_line_posts_user_id ON dream_line_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_line_posts_created_at ON dream_line_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dream_line_posts_visibility ON dream_line_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_oowops_post_id ON oowops(post_id);
CREATE INDEX IF NOT EXISTS idx_oowops_receiver_id ON oowops(receiver_id);
CREATE INDEX IF NOT EXISTS idx_trading_post_listings_category ON trading_post_listings(category);
CREATE INDEX IF NOT EXISTS idx_deals_requester_id ON deals(requester_id);
CREATE INDEX IF NOT EXISTS idx_deals_provider_id ON deals(provider_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_goals_expires ON trending_goals(expires_at);

-- Vector indexes (created after data exists — commented out for initial run)
-- CREATE INDEX idx_profiles_embedding ON profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX idx_goals_embedding ON goals USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX idx_dream_line_posts_embedding ON dream_line_posts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spirit_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hut_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_line_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oowops ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE villager_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_post_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindful_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE zen_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_locker_settings ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "profiles_public_view" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "goals_public_view" ON goals FOR SELECT USING (is_public = TRUE OR user_id = auth.uid());
CREATE POLICY "goals_own_all" ON goals FOR ALL USING (user_id = auth.uid());

CREATE POLICY "posts_public_view" ON dream_line_posts FOR SELECT USING (visibility = 'public' OR user_id = auth.uid());
CREATE POLICY "posts_own_all" ON dream_line_posts FOR ALL USING (user_id = auth.uid());

CREATE POLICY "oowops_view_all" ON oowops FOR SELECT USING (TRUE);
CREATE POLICY "oowops_own_insert" ON oowops FOR INSERT WITH CHECK (giver_id = auth.uid());

CREATE POLICY "spirit_own" ON spirit_configs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "hut_own" ON hut_configs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "skills_own" ON user_skills FOR ALL USING (user_id = auth.uid());
CREATE POLICY "interests_own" ON user_interests FOR ALL USING (user_id = auth.uid());
CREATE POLICY "restrictions_own" ON user_restrictions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "intentions_own" ON user_intentions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "mindful_own" ON mindful_moments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "zen_own" ON zen_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "journal_own" ON journal_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "wallet_own" ON village_wallets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "wallet_tx_own" ON wallet_transactions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "data_locker_own" ON data_locker_settings FOR ALL USING (user_id = auth.uid());

CREATE POLICY "listings_public_view" ON trading_post_listings FOR SELECT USING (is_active = TRUE);
CREATE POLICY "listings_own_all" ON trading_post_listings FOR ALL USING (user_id = auth.uid());

CREATE POLICY "deals_parties_view" ON deals FOR SELECT USING (requester_id = auth.uid() OR provider_id = auth.uid());
CREATE POLICY "deals_requester_insert" ON deals FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "tribes_public_view" ON tribes FOR SELECT USING (is_public = TRUE OR creator_id = auth.uid());
CREATE POLICY "tribe_members_view" ON tribe_members FOR SELECT USING (tribe_id IN (SELECT tribe_id FROM tribe_members WHERE user_id = auth.uid()));
CREATE POLICY "tribe_tasks_view" ON tribe_tasks FOR SELECT USING (tribe_id IN (SELECT tribe_id FROM tribe_members WHERE user_id = auth.uid()));

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_goal_steps_updated_at BEFORE UPDATE ON goal_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_trading_post_updated_at BEFORE UPDATE ON trading_post_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_tribes_updated_at BEFORE UPDATE ON tribes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create companion records on new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _username TEXT;
  _display  TEXT;
BEGIN
  _username := COALESCE(NEW.raw_user_meta_data->>'username', 'villager_' || substr(NEW.id::text, 1, 8));
  _display  := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Villager');

  INSERT INTO profiles (id, username, display_name)
  VALUES (NEW.id, _username, _display)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO village_wallets (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO hut_configs (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO spirit_configs (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO data_locker_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO user_xp (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update OoWop count on dream_line_posts + goal_steps
CREATE OR REPLACE FUNCTION update_oowop_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE dream_line_posts SET oowop_count = oowop_count + 1 WHERE id = NEW.post_id;
  IF NEW.step_id IS NOT NULL THEN
    UPDATE goal_steps
    SET oowops_received = oowops_received + 1,
        is_validated = (oowops_received + 1 >= oowops_needed)
    WHERE id = NEW.step_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_oowop_count ON oowops;
CREATE TRIGGER trg_oowop_count AFTER INSERT ON oowops FOR EACH ROW EXECUTE FUNCTION update_oowop_count();

-- Auto-update comment count
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE dream_line_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE dream_line_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comment_count ON post_comments;
CREATE TRIGGER trg_comment_count AFTER INSERT OR DELETE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Award villa9e score + VLG
CREATE OR REPLACE FUNCTION award_village_score(
  p_user_id     UUID,
  p_points      INT,
  p_vlg         DECIMAL DEFAULT 0,
  p_reason      TEXT DEFAULT '',
  p_reference_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  new_score INT;
  multiplier DECIMAL;
BEGIN
  SELECT COALESCE(score_multiplier, 1.00) INTO multiplier FROM profiles WHERE id = p_user_id;

  UPDATE profiles
  SET village_score = village_score + ROUND(p_points * multiplier)
  WHERE id = p_user_id
  RETURNING village_score INTO new_score;

  INSERT INTO village_score_log (user_id, score_change, vlg_earned, new_score, reason, reference_id)
  VALUES (p_user_id, ROUND(p_points * multiplier), p_vlg, new_score, p_reason, p_reference_id);

  IF p_vlg > 0 THEN
    UPDATE village_wallets SET vlg_balance = vlg_balance + p_vlg WHERE user_id = p_user_id;
  END IF;

  -- Update tier
  UPDATE profiles SET score_tier = CASE
    WHEN new_score >= 2500 THEN 'legend'
    WHEN new_score >= 1000 THEN 'elder'
    WHEN new_score >= 500  THEN 'builder'
    WHEN new_score >= 100  THEN 'grower'
    ELSE 'seedling'
  END WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED: SKILLS REFERENCE TABLE
-- ============================================================
INSERT INTO skills (name, category, subcategory) VALUES
('Graphic Design','Creative','Visual Arts'),
('Video Editing','Creative','Media Production'),
('Photography','Creative','Visual Arts'),
('Music Production','Creative','Audio'),
('Writing & Copywriting','Creative','Content'),
('Animation','Creative','Visual Arts'),
('Illustration','Creative','Visual Arts'),
('UI/UX Design','Creative','Digital Design'),
('Software Development','Technical','Engineering'),
('Mobile App Development','Technical','Engineering'),
('Web Development','Technical','Engineering'),
('Data Science','Technical','Analytics'),
('Cybersecurity','Technical','Security'),
('Machine Learning / AI','Technical','Engineering'),
('Blockchain Development','Technical','Web3'),
('Project Management','Business','Operations'),
('Marketing & Growth','Business','Marketing'),
('Sales','Business','Revenue'),
('Financial Planning','Business','Finance'),
('Business Strategy','Business','Strategy'),
('Legal & Contracts','Business','Legal'),
('Fundraising','Business','Finance'),
('Accounting','Business','Finance'),
('Construction','Trades','Building'),
('Electrical','Trades','Building'),
('Plumbing','Trades','Building'),
('Carpentry','Trades','Building'),
('Landscaping','Trades','Outdoor'),
('Personal Training','Wellness','Fitness'),
('Nutrition & Dietetics','Wellness','Health'),
('Mental Health Counseling','Wellness','Mental Health'),
('Life Coaching','Wellness','Coaching'),
('Yoga & Meditation','Wellness','Mind-Body'),
('Tutoring','Education','Academic'),
('Public Speaking','Education','Communication'),
('Language Translation','Education','Language'),
('Spiritual Guidance','Spiritual','Counseling'),
('Astrology','Spiritual','Divination'),
('Energy Healing','Spiritual','Alternative'),
('Cooking & Culinary','Creative','Food')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- END OF SCHEMA — villa9e v1.0
-- ============================================================
