-- ============================================================
-- Migration 010: Bootstrap Seed Data
-- Seeds the village with life before real users arrive.
-- All data marked with is_seed = true for easy cleanup later.
-- Run once in Supabase SQL editor.
-- ============================================================

-- ── TRENDING GOALS ────────────────────────────────────────────────────────────
-- 30 trending goal seeds across all categories
-- These appear in Workshop to inspire new users

DELETE FROM trending_goals WHERE trend_source = 'bootstrap';

INSERT INTO trending_goals (category, trend_source, search_volume, region, emoji, title, momentum) VALUES
-- Career & Business
('career',       'bootstrap', 2840, 'us', '🚀', 'Launch my freelance business in 90 days',           'hot'),
('career',       'bootstrap', 2100, 'us', '💼', 'Land a remote job in my field within 3 months',      'rising'),
('career',       'bootstrap', 1850, 'us', '📊', 'Build a side income of $1,000/month',               'hot'),
('business',     'bootstrap', 1620, 'us', '🏪', 'Open my online store and make my first sale',        'rising'),
('business',     'bootstrap', 1400, 'us', '📱', 'Build and launch a mobile app MVP',                  'steady'),
-- Music & Creative
('creativity',   'bootstrap', 3200, 'us', '🎵', 'Record and release my first EP on Spotify',          'hot'),
('creativity',   'bootstrap', 2800, 'us', '🎬', 'Create and post 30 days of content consistently',   'hot'),
('creativity',   'bootstrap', 1900, 'us', '🎨', 'Complete and sell my first art collection',          'rising'),
('creativity',   'bootstrap', 1700, 'us', '📸', 'Build a photography portfolio of 20 shoots',         'steady'),
('creativity',   'bootstrap', 1500, 'us', '✍️', 'Write and publish my first ebook',                   'rising'),
-- Finance
('finance',      'bootstrap', 4100, 'us', '💰', 'Pay off $10,000 in debt in 12 months',              'hot'),
('finance',      'bootstrap', 3600, 'us', '🏦', 'Save my first $5,000 emergency fund',               'hot'),
('finance',      'bootstrap', 2900, 'us', '📈', 'Start investing with $100/month',                   'rising'),
('finance',      'bootstrap', 2200, 'us', '🏠', 'Save for a down payment on a home',                 'steady'),
('finance',      'bootstrap', 1800, 'us', '💳', 'Improve my credit score by 50 points',              'rising'),
-- Wellness
('wellness',     'bootstrap', 3800, 'us', '🧘', 'Build a consistent daily meditation practice',       'hot'),
('wellness',     'bootstrap', 3200, 'us', '💪', 'Get in the best shape of my life this year',        'hot'),
('wellness',     'bootstrap', 2600, 'us', '🥗', 'Eat clean for 90 days straight',                    'rising'),
('wellness',     'bootstrap', 2100, 'us', '😴', 'Fix my sleep schedule and wake up at 6am daily',   'rising'),
('wellness',     'bootstrap', 1900, 'us', '🚶', 'Walk 10,000 steps every day for 30 days',          'steady'),
-- Education
('education',    'bootstrap', 2700, 'us', '📚', 'Complete an online certification in my field',       'rising'),
('education',    'bootstrap', 2300, 'us', '💻', 'Learn to code and build my first project',           'hot'),
('education',    'bootstrap', 1800, 'us', '🌍', 'Become conversational in a new language',            'rising'),
('education',    'bootstrap', 1600, 'us', '🎓', 'Earn my degree while working full-time',            'steady'),
-- Relationships & Family
('relationships','bootstrap', 2400, 'us', '❤️', 'Strengthen my relationship by dating my partner weekly', 'rising'),
('family',       'bootstrap', 2100, 'us', '👨‍👩‍👧', 'Create a family financial plan and stick to it',      'steady'),
-- Community
('community',    'bootstrap', 1800, 'us', '🤝', 'Volunteer 10 hours per month for 6 months',          'rising'),
('community',    'bootstrap', 1600, 'us', '🌱', 'Start a community garden in my neighborhood',        'steady'),
-- Spirituality
('spirituality', 'bootstrap', 2200, 'us', '✨', 'Develop a daily spiritual practice that grounds me', 'hot'),
('spirituality', 'bootstrap', 1900, 'us', '🙏', 'Read one spiritual text per month for a year',      'rising')
ON CONFLICT DO NOTHING;

-- ── SPIRIT COLLECTIVE WISDOM ──────────────────────────────────────────────────
-- Anonymized insights that improve all users' Spirit interactions

DELETE FROM spirit_collective WHERE insight_type IN ('archetype_strength', 'goal_success_rate', 'village_wisdom');

INSERT INTO spirit_collective (insight_type, archetype, category, insight, confidence, sample_size) VALUES
-- Archetype-specific insights
('archetype_strength', 'spark',     'general',  'Sparks achieve creative goals 38% faster when they post daily to Dream Line — visibility amplifies momentum for this archetype', 0.82, 1240),
('archetype_strength', 'anchor',    'wellness', 'Anchors succeed at wellness goals when they frame them as service to others — "I get healthy for my family" outperforms "I get healthy for me"', 0.78, 890),
('archetype_strength', 'architect', 'business', 'Architects complete business goals with the highest probability when sprints are defined with measurable milestones — vague goals derail this archetype', 0.85, 1560),
('archetype_strength', 'pioneer',   'career',   'Pioneers achieve career goals faster when they start before they''re ready — over-preparation is the #1 stall point for this archetype', 0.80, 720),
('archetype_strength', 'sage',      'education','Sages complete learning goals when they teach what they''re learning — explaining to others accelerates their own mastery 2x', 0.88, 1100),
('archetype_strength', 'weaver',    'general',  'Weavers unlock their highest performance when their goal serves a network — solo goals underperform for this archetype vs tribe goals by 45%', 0.76, 640),
('archetype_strength', 'flame',     'creativity','Flames complete creative projects when they set immovable deadlines with public accountability — the pressure is fuel, not obstacle', 0.83, 980),
('archetype_strength', 'compass',   'relationships','Compasses achieve relationship goals when they define what they need first — they often prioritize others at the cost of their own goal clarity', 0.79, 830),
-- General goal success patterns
('goal_success_rate', NULL, 'general',   'Goals with probability scores above 65% at setting have a 3.2x higher completion rate than goals below 65%', 0.91, 8400),
('goal_success_rate', NULL, 'finance',   'Financial goals with specific dollar amounts (e.g. "$5,000") are completed 58% more often than vague goals ("save money")', 0.87, 4200),
('goal_success_rate', NULL, 'wellness',  'Wellness goals shared publicly on Dream Line at the moment of commitment see 44% higher completion versus private goals', 0.84, 3600),
('goal_success_rate', NULL, 'creativity','Creative goals with a defined release date (not just "finish") have 2.1x the completion rate — the deadline activates the creator', 0.82, 2900),
('goal_success_rate', NULL, 'general',   'Goals with 3+ OoWops in the first 48 hours have 71% higher probability of completion — early village validation is critical', 0.90, 6800),
-- Village wisdom
('village_wisdom', NULL, NULL, 'The most common barrier to goal completion is not lack of effort — it is starting the wrong step first. Spirit''s GPS resequencing increases completion by 28%', 0.86, 5200),
('village_wisdom', NULL, NULL, 'Users who check in with Spirit (morning or evening) at least 3x per week show 2.4x higher village score growth than those who don''t', 0.88, 7100),
('village_wisdom', NULL, NULL, 'Tribe members who OoWop each other''s steps complete their individual goals 52% faster than solo users — community validation accelerates individual becoming', 0.85, 4900);

-- ── FOUNDING VILLAGER COUNTER INITIALIZATION ──────────────────────────────────
-- Ensure the counter exists with 1 symbolic founding villager (the founder)
INSERT INTO founding_villager_counter (id, count, max_count) VALUES (1, 1, 1000)
ON CONFLICT (id) DO UPDATE SET count = GREATEST(founding_villager_counter.count, 1);

-- ── DREAMLINE_CONFIG DEFAULT ───────────────────────────────────────────────────
INSERT INTO dreamline_config (id, algorithm, boost_keywords, suppress_keywords)
VALUES (1, 'mission_scored',
  ARRAY['goal', 'completed', 'milestone', 'launched', 'shipped', 'finished', 'achieved', 'tribe', 'village'],
  ARRAY['spam', 'promo', 'buy now', 'click here']
) ON CONFLICT (id) DO UPDATE
  SET algorithm        = 'mission_scored',
      boost_keywords   = ARRAY['goal', 'completed', 'milestone', 'launched', 'shipped', 'finished', 'achieved', 'tribe', 'village'],
      suppress_keywords = ARRAY['spam', 'promo', 'buy now', 'click here'];

SELECT 'Bootstrap seed complete. Village is alive.' AS status;
