# DREAMLINE — COMPLETE SPECIFICATION

> Logged 2026-06-10. The social heartbeat of The Village — a **goal-aware social feed**
> (NOT a TikTok clone). Workshop is the library (purposeful); DreamLine is the town square.
> Human progress is the content. Every post anchors to a goal, sprint, achievement, or
> moment in someone's journey.

## Three tabs
1. **DreamLine** (algorithmic) — main feed, goal-aware ranking. Default.
2. **Following** — chronological, no algorithm.
3. **Village** (curated) — editorial: featured completions, spotlight creators, trending
   categories, featured Goal DNA templates. Updated daily.

## The goal-aware algorithm (progress-maximizing, not engagement-maximizing)

**Five audience tiers (priority order):**
1. **Mentors** — further ahead on the same goal category (most useful feedback).
2. **Alumni** — completed a goal in the viewer's category (on-chain credential; the destination).
3. **Protégés** — behind the viewer (reminds how far they've come; primes them to mentor).
4. **Tribe** — everyone in the viewer's network regardless of goal alignment.
5. **Algorithmic discovery** — outside network, ranked by goal relevance + engagement quality.

**Goal signal layer:** feed shaped by the WHOLE profile — active/completed goals, Skill
Stream history, Trading Post categories, Market history, Wellness (high stress → recovery
content), Spaces calendar (event tomorrow → motivation today), Bank goals, $VICO tier.
No single signal dominates.

**Eye-tracking engagement (consented, on-device only):** front camera via ML Kit / Apple
Vision tracks eyes-on-screen, dwell time by content type, micro-expressions, gaze return.
Never tracks identity/emotion/faceprint; data never leaves device — only a 0–100 score
per item is sent. Combined with explicit signals (OoWop/comment/share/save/replay) into a
composite. Watched-fully + high eye engagement = strong positive; swiped <2s = strong
negative; finished but low engagement = weak positive (finished out of obligation).

**Fine-tuning preferences:** goal content mix slider (default 70% goal / 30% discovery),
content-type toggles, mentor-vs-protégé balance, feedback intensity (celebration↔critical),
clickbait detection (Spirit flags caption/thumbnail vs content; cross-references on-chain
achievement record to catch fake-achievement clickbait).

### Ranking formula
```
final = (relationship×0.30 + goalRelevance×0.25 + quality×0.15 + engagement×0.10
        + eyeEngagement×0.10 + recency×0.05 + prefAlignment×0.05) × (1 - diversityPenalty)
relationship: mentor 100, alumni 90, protege 75, tribe 60, discovery 20
recency: 100 at 0h, 50 at 24h, 20 at 72h (exp decay)
sponsored post inserted every 4th position
```

## Content types (labeled in Creator Studio)
- **Goal Update** (most important) — linked to a goal; card shows goal title pill, 32px
  progress ring, sprint label, mentor/alumni/protégé badge.
- **Sprint completion** — auto-templated; teal accent border, "Sprint complete" badge,
  on-chain verification chain icon.
- **Goal completion** (highest status) — auto-generated; goal title, time, sprints,
  actions, GVS, AI summary; **premium algorithmic distribution** (shown widely — seeing a
  real person complete your goal is the strongest motivator).
- **Milestone celebration**, **Progress photo/video**, **Reflection** (text; weighted to
  mentors/alumni), **Ask for feedback** (distributed to mentors/alumni), **Text photo**
  (from Text Studio).

## Feed card design (Facebook-style, not full-screen)
Header: 48px avatar (goal-category color ring on goal updates), username, **relationship
badge** (Mentor teal / Alumni gold / Protégé purple / Tribe blue), time, ⋯ menu.
Goal context strip (goal-linked posts): goal title + 32px progress ring + sprint ref,
category-colored. Content zone: photo/video (auto-play muted, eye-tracking)/text/carousel.
Caption (150 char + more, tappable hashtags/@mentions/goal tags). Engagement row: OoWop
(creator +0.5 $VLG, viewer +1 $VLG, double-tap content to OoWop), Comment, Share, Save.
Comment preview (top 2, mentor/alumni badges). Ad every 4th card (Sponsored + "Why am I
seeing this?").

## Comment system (mentorship, not reactions)
Ranked by commenter relationship (alumni/mentor highest) + depth + OoWops + eye dwell.
Optional comment-type tags: Advice, Encouragement, Question, Personal experience,
Resource, Constructive feedback (surfaced per viewer's feedback-intensity pref).
**Alumni insight** badge (teal) on comments from verified same-category alumni — displayed
first with emphasis.

## Sound layer (TikTok-style)
Sounds become discovery vectors. Sound page `/village/dreamline/sounds`: trending this
week, trending by goal category, from follows, saved. Categories: motivation/affirmation,
focus, celebration, reflection, workout. ViCo: original sound used >100× → 50 $VLG bonus;
+0.1 $VLG/use beyond (cap 1,000 uses = 100 $VLG).

## Settings (gear top-right)
Feed prefs (mix slider, type toggles, mentor/protégé balance, feedback intensity),
eye tracking (enable/disable, view/reset data), notifications (mentor/alumni comment,
OoWop milestones, tribe goal updates, same-goal completions), clickbait filter (default on).

## DB schema
`dreamline_posts` (content_type, goal_id, sprint_id, achievement_credential_id, caption,
media, sound_id, goal_progress_at_post, is_feedback_request, oowop/comment/share/save/view
counts, eye_engagement_avg, completion_rate, is_sponsored, is_clickbait_flagged,
spirit_quality_score), `dreamline_feed_events` (relationship, goal_relevance, eye score,
algorithm_score), `dreamline_comments` (comment_type, commenter_relationship,
is_alumni_insight, oowop_count), `dreamline_sounds`, `dreamline_preferences`,
`dreamline_algorithm_weights` (platform-tunable). (Full DDL in source.)

## Ads
Most contextually targeted in the app — feed knows active goals, current sprint, financial
goals, wellness, content prefs simultaneously. Targets by current GPS action (course-launch
sprint 3 → mic/email tools; just completed "get a job in tech" → laptop, dev courses,
financial planning). Reads entire profile, not just DreamLine activity.

See [[project-villa9e-vision-log]], WORKSHOP_SPEC.md, PAVILION_SPEC.md.
