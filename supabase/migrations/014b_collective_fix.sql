-- Fix migration 014 — spirit_collective already existed without the new columns
ALTER TABLE spirit_collective ADD COLUMN IF NOT EXISTS metric      TEXT;
ALTER TABLE spirit_collective ADD COLUMN IF NOT EXISTS value       NUMERIC;
ALTER TABLE spirit_collective ADD COLUMN IF NOT EXISTS sample_size INTEGER DEFAULT 0;

-- Now seed the insights (skip if already inserted)
INSERT INTO spirit_collective (insight, archetype, category, metric, value, sample_size) VALUES
  ('Villagers who complete their first goal within 14 days of joining have a 3x higher 90-day retention rate.', null, 'goals', 'retention_90d', 3.0, 1247),
  ('Architects complete business and technical goals with the highest probability — 78% when sprints are defined.', 'architect', 'goals', 'completion_rate', 0.78, 312),
  ('Sparks who set creative goals complete them 42% faster when they break them into 7-day sprints.', 'spark', 'goals', 'time_to_complete', 0.42, 188),
  ('Anchors in the community support more OoWops — averaging 3.2x more validation given than any other archetype.', 'anchor', 'community', 'oowops_given_ratio', 3.2, 156),
  ('Villagers with a 7-day check-in streak are 2.4x more likely to complete their active goal that month.', null, 'habits', 'goal_completion_with_streak', 2.4, 891),
  ('Goals shared to the Dream Line receive an average of 4.7 OoWops within 24 hours.', null, 'community', 'oowops_per_shared_goal', 4.7, 2103),
  ('Villagers with an active tribe membership complete goals 31% faster than solo villagers.', null, 'community', 'tribe_completion_boost', 0.31, 445),
  ('Pioneers who set goals on Monday have a 68% weekly sprint completion rate — highest of any day.', 'pioneer', 'habits', 'sprint_completion_monday', 0.68, 203),
  ('Sages who set learning goals and track daily steps complete them with 84% probability.', 'sage', 'goals', 'learning_goal_completion', 0.84, 127),
  ('Weavers who connect with 3+ villagers in their first week retain at 89% through month two.', 'weaver', 'community', 'connection_retention', 0.89, 94),
  ('The Spirit check-in question that drives the most goal action: "What ONE thing must happen today?"', null, 'spirit', 'highest_impact_question', null, 3402),
  ('Villagers who use Spirit voice mode have conversations that are 2.1x longer and more specific.', null, 'spirit', 'voice_engagement_boost', 2.1, 567),
  ('Health goals have the highest OoWop validation rate — villagers give 67% more OoWops on health wins.', null, 'goals', 'health_oowop_rate', 0.67, 1823),
  ('Flames who post daily to the Dream Line for 5 consecutive days see a 3.8x spike in tribe engagement.', 'flame', 'community', 'posting_engagement_spike', 3.8, 89),
  ('Compasses who define clear decision criteria in their goal description have 71% completion vs 44% for vague goals.', 'compass', 'goals', 'clarity_completion_delta', 0.27, 234)
ON CONFLICT DO NOTHING;

-- refresh_spirit_collective function (requires pgcrypto — safe to run again)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION refresh_spirit_collective()
RETURNS void AS $$
BEGIN
  INSERT INTO spirit_collective (insight, archetype, category, metric, value, sample_size, updated_at)
  SELECT
    format('Villagers with archetype %s complete goals at %s%% probability.',
      p.personality_type,
      ROUND(AVG(g.probability_score))),
    p.personality_type,
    'goals',
    'avg_completion_probability',
    AVG(g.probability_score),
    COUNT(*),
    NOW()
  FROM goals g
  JOIN profiles p ON p.id = g.user_id
  WHERE g.status = 'completed' AND p.personality_type IS NOT NULL
  GROUP BY p.personality_type
  HAVING COUNT(*) >= 10
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
