-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 027: GPS V2 — Circumstances, Gap Analysis, Life Events, Recalibrations
-- Safe to re-run. No ENUMs, no DO blocks, TEXT columns throughout.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Upgrade goals table with GPS V2 columns ─────────────────────────────────
alter table goals add column if not exists gps_stage text default 'intake';
alter table goals add column if not exists probability_threshold integer default 95;
alter table goals add column if not exists circumstances_assessed boolean default false;
alter table goals add column if not exists last_recalibrated_at timestamptz;
alter table goals add column if not exists recalibration_count integer default 0;
alter table goals add column if not exists momentum_score integer default 100;
alter table goals add column if not exists weekly_hours_available integer default 10;
alter table goals add column if not exists gps_plan jsonb default '{}';

-- ─── Goal Circumstances ───────────────────────────────────────────────────────
-- Stores the multi-agent assessed circumstances for a goal
create table if not exists goal_circumstances (
  id                        uuid primary key default gen_random_uuid(),
  goal_id                   uuid not null references goals(id) on delete cascade,
  user_id                   uuid not null references profiles(id) on delete cascade,

  -- Skills dimension
  skills_required           text[] default '{}',
  skills_user_has           text[] default '{}',
  skills_gap                text[] default '{}',
  skills_severity           text default 'none',
  skills_workshop_courses   text[] default '{}',
  skills_weeks_to_fill      integer default 0,

  -- Funding dimension
  funding_total_estimated   integer default 0,
  funding_user_available    integer default 0,
  funding_gap               integer default 0,
  funding_severity          text default 'none',
  funding_strategies        jsonb default '[]',
  funding_can_self_fund     boolean default true,

  -- Team dimension
  team_roles_needed         jsonb default '[]',
  team_can_solo             boolean default true,
  team_severity             text default 'none',

  -- Time dimension
  time_hours_week_needed    integer default 0,
  time_hours_week_available integer default 0,
  time_deficit_hours        integer default 0,
  time_severity             text default 'none',
  time_accelerators         text[] default '{}',
  time_realistic_weeks      integer default 12,

  -- AI resources dimension
  ai_tools                  jsonb default '[]',
  ai_acceleration_factor    numeric default 0,
  ai_can_replace            text[] default '{}',

  -- Raw agent outputs for transparency
  agent_outputs             jsonb default '{}',

  created_at                timestamptz default now(),
  updated_at                timestamptz default now()
);

alter table goal_circumstances enable row level security;
drop policy if exists "users own goal circumstances" on goal_circumstances;
create policy "users own goal circumstances"
  on goal_circumstances for all using (user_id = auth.uid());

-- ─── Goal Gap Analysis ────────────────────────────────────────────────────────
create table if not exists goal_gap_analysis (
  id                              uuid primary key default gen_random_uuid(),
  goal_id                         uuid not null references goals(id) on delete cascade,
  user_id                         uuid not null references profiles(id) on delete cascade,

  gaps                            jsonb default '[]',
  prob_without_gaps               integer default 0,
  prob_with_all_gaps_filled       integer default 0,
  prob_with_recommended_gaps      integer default 0,
  recommended_gap_order           text[] default '{}',
  village_routes_needed           jsonb default '{}',
  analysis_text                   text,
  can_reach_95                    boolean default false,

  created_at                      timestamptz default now(),
  updated_at                      timestamptz default now()
);

alter table goal_gap_analysis enable row level security;
drop policy if exists "users own gap analysis" on goal_gap_analysis;
create policy "users own gap analysis"
  on goal_gap_analysis for all using (user_id = auth.uid());

-- ─── Goal Life Events ─────────────────────────────────────────────────────────
-- Real-world events that affect the GPS plan
create table if not exists goal_life_events (
  id                      uuid primary key default gen_random_uuid(),
  goal_id                 uuid not null references goals(id) on delete cascade,
  user_id                 uuid not null references profiles(id) on delete cascade,

  event_type              text not null,
  -- skill_acquired | team_member_joined | funding_secured | funding_lost
  -- mentor_connected | schedule_change | health_setback | life_obstacle
  -- positive_windfall | new_resource | scope_change | action_missed | sprint_missed
  event_source            text default 'user',

  title                   text not null,
  description             text,

  probability_delta       integer default 0,
  time_delta_days         integer default 0,

  reference_type          text,
  reference_id            uuid,

  triggered_recalibration boolean default false,
  recalibration_id        uuid,

  metadata                jsonb default '{}',

  created_at              timestamptz default now()
);

alter table goal_life_events enable row level security;
drop policy if exists "users own life events" on goal_life_events;
create policy "users own life events"
  on goal_life_events for all using (user_id = auth.uid());

-- ─── Goal Recalibrations ─────────────────────────────────────────────────────
-- Full log of every GPS recalibration with deltas
create table if not exists goal_recalibrations (
  id                    uuid primary key default gen_random_uuid(),
  goal_id               uuid not null references goals(id) on delete cascade,
  user_id               uuid not null references profiles(id) on delete cascade,

  reason                text not null,
  life_event_id         uuid references goal_life_events(id),

  probability_before    integer,
  probability_after     integer,
  probability_delta     integer,

  timeline_weeks_before integer,
  timeline_weeks_after  integer,
  timeline_delta_weeks  integer,

  spirit_message        text,
  momentum_action       text,
  recalibration_insight text,
  timeline_explainer    text,
  probability_explainer text,

  recalibrated_sprints  jsonb default '[]',
  is_on_track           boolean default true,

  created_at            timestamptz default now()
);

alter table goal_recalibrations enable row level security;
drop policy if exists "users own recalibrations" on goal_recalibrations;
create policy "users own recalibrations"
  on goal_recalibrations for all using (user_id = auth.uid());

-- ─── Goal Probability Log (safe create — may already exist) ──────────────────
create table if not exists goal_probability_log (
  id         uuid primary key default gen_random_uuid(),
  goal_id    uuid not null references goals(id) on delete cascade,
  score      integer not null,
  factors    jsonb default '{}',
  created_at timestamptz default now()
);

alter table goal_probability_log enable row level security;
drop policy if exists "users own probability log" on goal_probability_log;
create policy "users own probability log"
  on goal_probability_log for select
  using (goal_id in (select id from goals where user_id = auth.uid()));
drop policy if exists "users insert probability log" on goal_probability_log;
create policy "users insert probability log"
  on goal_probability_log for insert
  with check (goal_id in (select id from goals where user_id = auth.uid()));

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_goal_circumstances_goal_id on goal_circumstances(goal_id);
create index if not exists idx_goal_gap_analysis_goal_id on goal_gap_analysis(goal_id);
create index if not exists idx_goal_life_events_goal_id on goal_life_events(goal_id);
create index if not exists idx_goal_recalibrations_goal_id on goal_recalibrations(goal_id);
create index if not exists idx_goals_gps_stage on goals(gps_stage);
create index if not exists idx_goals_user_gps on goals(user_id, gps_stage);
