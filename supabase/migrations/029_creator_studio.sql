-- Migration 029: Creator Studio — full content creation pipeline
-- Safe to re-run. No ENUMs, no DO blocks.

-- Fix studio_videos (add missing column referenced in action-content route)
alter table studio_videos add column if not exists duration_seconds float;
alter table studio_videos add column if not exists post_label text;

-- ── Main posts table ──────────────────────────────────────────────────────────
create table if not exists studio_posts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,

  -- Content
  content_type        text default 'video',   -- 'video', 'photo', 'text'
  media_url           text,
  thumbnail_url       text,
  cloudinary_id       text,
  duration_seconds    float,
  aspect_ratio        text default '9:16',

  -- Post details
  caption             text,
  description         text,
  location_name       text,
  location_lat        float,
  location_lng        float,
  cover_frame_seconds float,

  -- Content label — connects to Workshop, GPS, Dreamline
  post_label          text,  -- 'goal_recap','action_how_to','sprint_update','general','help_request','product_review'
  goal_id             uuid references goals(id) on delete set null,
  sprint_id           uuid references sprints(id) on delete set null,
  action_ref          text,

  -- Workshop flags
  is_workshop_content boolean default false,
  workshop_category   text,

  -- Affiliate
  has_affiliate       boolean default false,
  affiliate_url       text,
  affiliate_product   text,

  -- Visibility
  visibility          text default 'everyone',   -- 'everyone','tribe','only_me'
  tribe_id            uuid,
  is_18_plus          boolean default false,

  -- Interaction toggles
  allow_comments      boolean default true,
  allow_remixes       boolean default true,
  is_template         boolean default false,
  is_ai_generated     boolean default false,
  save_to_device      boolean default true,
  save_with_watermark boolean default false,
  allow_visual_search boolean default true,
  allow_product_id    boolean default true,
  allow_hq_upload     boolean default true,

  -- Ad settings
  is_ad               boolean default false,
  ad_only             boolean default false,

  -- CTA
  cta_text            text,
  cta_url             text,

  -- AI content
  transcript          text,
  ai_keywords         text[],
  ai_summary          text,
  language            text default 'en',

  -- Edit state (stored so drafts/edits are resumable)
  edit_state          jsonb default '{}',  -- filters, text overlays, adjustments, trim

  -- Sound
  sound_title         text,
  sound_url           text,
  sound_source        text,  -- 'original','spotify','library'
  sound_start_seconds float default 0,

  -- Moderation
  is_flagged          boolean default false,
  flag_reason         text,
  is_approved         boolean default true,

  -- Metrics (denormalized)
  oowop_count         integer default 0,
  comment_count       integer default 0,
  favorite_count      integer default 0,
  share_count         integer default 0,
  view_count          integer default 0,

  -- Status
  status              text default 'published',  -- 'draft','processing','published','deleted'

  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  published_at        timestamptz
);

-- ── Hashtags ──────────────────────────────────────────────────────────────────
create table if not exists post_hashtags (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references studio_posts(id) on delete cascade,
  tag        text not null,
  created_at timestamptz default now()
);

-- ── Mentions ──────────────────────────────────────────────────────────────────
create table if not exists post_mentions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references studio_posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- ── OoWops ────────────────────────────────────────────────────────────────────
create table if not exists post_oowops (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references studio_posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- ── Comments ──────────────────────────────────────────────────────────────────
create table if not exists post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references studio_posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  parent_id   uuid references post_comments(id) on delete cascade,
  content     text not null,
  is_flagged  boolean default false,
  oowop_count integer default 0,
  created_at  timestamptz default now()
);

-- ── Comment OoWops ────────────────────────────────────────────────────────────
create table if not exists comment_oowops (
  id          uuid primary key default gen_random_uuid(),
  comment_id  uuid not null references post_comments(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(comment_id, user_id)
);

-- ── Favorites ─────────────────────────────────────────────────────────────────
create table if not exists post_favorites (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references studio_posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- ── Views ─────────────────────────────────────────────────────────────────────
create table if not exists post_views (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references studio_posts(id) on delete cascade,
  user_id     uuid references profiles(id) on delete set null,
  watch_pct   float default 0,
  created_at  timestamptz default now()
);

-- ── Shares ────────────────────────────────────────────────────────────────────
create table if not exists post_shares (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references studio_posts(id) on delete cascade,
  user_id     uuid references profiles(id) on delete set null,
  platform    text,
  created_at  timestamptz default now()
);

-- ── User sound library ────────────────────────────────────────────────────────
create table if not exists studio_sounds (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  title            text not null,
  audio_url        text not null,
  duration_seconds float,
  source           text default 'original',  -- 'original','spotify','uploaded'
  spotify_id       text,
  is_public        boolean default false,
  use_count        integer default 0,
  created_at       timestamptz default now()
);

-- ── Drafts ────────────────────────────────────────────────────────────────────
create table if not exists studio_drafts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  media_url     text,
  cloudinary_id text,
  content_type  text default 'video',
  thumbnail_url text,
  draft_data    jsonb default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── Transcripts ───────────────────────────────────────────────────────────────
create table if not exists post_transcripts (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references studio_posts(id) on delete cascade unique,
  transcript text,
  captions   jsonb,   -- [{start, end, text}]
  keywords   text[],
  language   text default 'en',
  created_at timestamptz default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table studio_posts      enable row level security;
alter table post_hashtags      enable row level security;
alter table post_mentions      enable row level security;
alter table post_oowops        enable row level security;
alter table post_comments      enable row level security;
alter table comment_oowops     enable row level security;
alter table post_favorites     enable row level security;
alter table post_views         enable row level security;
alter table post_shares        enable row level security;
alter table studio_sounds      enable row level security;
alter table studio_drafts      enable row level security;
alter table post_transcripts   enable row level security;

-- studio_posts: owner full access + public can read published
drop policy if exists "studio_posts owner"   on studio_posts;
drop policy if exists "studio_posts public"  on studio_posts;
create policy "studio_posts owner"  on studio_posts for all  using (user_id = auth.uid());
create policy "studio_posts public" on studio_posts for select using (status = 'published' and is_approved = true and visibility = 'everyone');

-- post_hashtags
drop policy if exists "hashtags owner"  on post_hashtags;
drop policy if exists "hashtags read"   on post_hashtags;
create policy "hashtags owner" on post_hashtags for all    using (post_id in (select id from studio_posts where user_id = auth.uid()));
create policy "hashtags read"  on post_hashtags for select using (true);

-- post_mentions
drop policy if exists "mentions owner" on post_mentions;
drop policy if exists "mentions read"  on post_mentions;
create policy "mentions owner" on post_mentions for all    using (post_id in (select id from studio_posts where user_id = auth.uid()));
create policy "mentions read"  on post_mentions for select using (true);

-- OoWops
drop policy if exists "oowops owner" on post_oowops;
drop policy if exists "oowops read"  on post_oowops;
create policy "oowops owner" on post_oowops for all    using (user_id = auth.uid());
create policy "oowops read"  on post_oowops for select using (true);

-- Comments
drop policy if exists "comments owner" on post_comments;
drop policy if exists "comments read"  on post_comments;
create policy "comments owner" on post_comments for all    using (user_id = auth.uid());
create policy "comments read"  on post_comments for select using (true);

-- Comment OoWops
drop policy if exists "comment_oowops owner" on comment_oowops;
drop policy if exists "comment_oowops read"  on comment_oowops;
create policy "comment_oowops owner" on comment_oowops for all    using (user_id = auth.uid());
create policy "comment_oowops read"  on comment_oowops for select using (true);

-- Favorites
drop policy if exists "favorites owner" on post_favorites;
create policy "favorites owner" on post_favorites for all using (user_id = auth.uid());

-- Views
drop policy if exists "views owner"  on post_views;
drop policy if exists "views insert" on post_views;
create policy "views owner"  on post_views for all    using (user_id = auth.uid());
create policy "views insert" on post_views for insert with check (true);

-- Shares
drop policy if exists "shares owner"  on post_shares;
drop policy if exists "shares insert" on post_shares;
create policy "shares owner"  on post_shares for all    using (user_id = auth.uid());
create policy "shares insert" on post_shares for insert with check (true);

-- Sounds
drop policy if exists "sounds owner"  on studio_sounds;
drop policy if exists "sounds public" on studio_sounds;
create policy "sounds owner"  on studio_sounds for all    using (user_id = auth.uid());
create policy "sounds public" on studio_sounds for select using (is_public = true);

-- Drafts
drop policy if exists "drafts owner" on studio_drafts;
create policy "drafts owner" on studio_drafts for all using (user_id = auth.uid());

-- Transcripts
drop policy if exists "transcripts owner" on post_transcripts;
drop policy if exists "transcripts read"  on post_transcripts;
create policy "transcripts owner" on post_transcripts for all    using (post_id in (select id from studio_posts where user_id = auth.uid()));
create policy "transcripts read"  on post_transcripts for select using (true);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_studio_posts_user     on studio_posts(user_id, created_at desc);
create index if not exists idx_studio_posts_label    on studio_posts(post_label, status);
create index if not exists idx_studio_posts_workshop on studio_posts(is_workshop_content, status) where is_workshop_content = true;
create index if not exists idx_studio_posts_dreamline on studio_posts(status, visibility, created_at desc);
create index if not exists idx_post_hashtags_tag     on post_hashtags(tag);
create index if not exists idx_post_oowops_post      on post_oowops(post_id);
create index if not exists idx_post_comments_post    on post_comments(post_id, created_at desc);
create index if not exists idx_post_favorites_user   on post_favorites(user_id, created_at desc);

-- ── Auto-update updated_at ────────────────────────────────────────────────────
create or replace function update_studio_post_timestamp()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists studio_posts_updated_at on studio_posts;
create trigger studio_posts_updated_at before update on studio_posts
  for each row execute function update_studio_post_timestamp();
