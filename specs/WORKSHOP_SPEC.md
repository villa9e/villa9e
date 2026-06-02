# Workshop — Complete Build Specification
# Source: User vision document. DO NOT delete or modify without updating the corresponding code.
# Last updated: 2026-06-01

## 1. What This Is

Workshop is the heart of The Village super app. Full-screen vertical video feed (TikTok feel) that serves as the execution engine for a GPS-style goal achievement system. Users talk to Spirit AI who builds them a personalized Goal GPS plan broken into:

- **Goals** — what the user wants to achieve
- **Sprints** — weekly execution blocks (time-boxed phases)
- **Actions** — individual verifiable tasks within each sprint

The GPS feature is the core product. Everything else (feed, videos, templates, OoWop, $VLG) exists to serve the GPS and keep users moving toward their goals.

---

## 2. Navigation — Teepee Radial Menu

Single teepee/tent button centered at the bottom. Opens a radial arc menu. No top nav bar, no side drawer, no standard tab bar.

### Teepee button
- 56px circle, Village brand royal blue `#0033CC` background
- White teepee icon centered, 28px
- Outer ring: `1.5px solid rgba(255,255,255,0.15)`
- States: Default | Pressed (scale 0.94, 120ms) | Open (rotates to X, bg `#26215C`)

### Radial arc menu
- 7 items fan out in 180-degree crescent arc above button
- Arc radius: 110px from button center
- Spring animation: staggered 40ms per item, tension 300, friction 20

**7 items (left to right):**
1. Workshop — grid icon → `/village/workshop`
2. Goals — flag icon → `/village/workshop` (goals tab)
3. Create — plus icon → `/village/create`
4. DreamLine — timeline icon → `/village/dreamline`
5. Trading Post — store icon → `/village/trading-post`
6. Bank — bank icon → `/village/bank`
7. Profile — user's avatar → `/village/hut`

Each item: 48px circle, `rgba(0,0,0,0.75)` bg, white icon 20px, label pill below.
Dark overlay `rgba(0,0,0,0.4)` fades in behind menu on open.

---

## 3. Workshop Feed Architecture

### Route: `/village/workshop`

### Tabs at top: Goals | Workshop | GPS
- Swipe left from Workshop → GPS tab
- Swipe right from Workshop → Spirit chat (goal creation)
- Swipe left from Goals → Workshop
- Swipe left from GPS → nothing

### Feed layout
- Vertical scroll-snap container, `scroll-snap-type: y mandatory`
- Each card: `scroll-snap-align: start`, `height: 100dvh`
- Background: always `#000000` black

### Touch gestures
- **Vertical scroll** — move between cards (native scroll-snap)
- **Right swipe** (80px+, under 400ms, <30px vertical) — navigate to Spirit chat
- **Single tap** — pause/unpause video, show pause indicator
- **Double tap** (within 300ms) — OoWop, fist fly-up animation

### Card ordering algorithm
1. First card: video matched to user's current active GPS Sprint Action
2. Every 3–4 video cards: inject one non-video card (template, goal, achievement, or guide)
3. Videos ordered by mission match score descending, Studio before YouTube at equal scores
4. No active GPS: Guide card as second card, template every 3 cards
5. Achievement cards injected immediately after Sprint completion event

---

## 4. Card Types

### 4.1 YouTube video card
- Full screen dark navy `#0c1828` background
- Action context banner: purple `rgba(83,74,183,0.88)`, shows Sprint/Action reference + title
- Right action rail (5 buttons)
- Bottom: creator, title, metadata, format badge (Wayfinder/Pathfinder/Trailblazer), mission score pill
- "Mark action complete" button: purple `#7f77dd`
- Progress bar: 2px, white fill, draggable dot for seeking

### 4.2 Studio creator video card
- Deep forest `#081a0e` background
- Action banner: teal-green `rgba(15,110,86,0.88)`
- Platform's own video player (not YouTube embed)
- Studio priority: mission score ≥70 appears before YouTube same score

### 4.3 Goal DNA template card
- Deep purple `#100d20` background, DNA icon centered
- Stats: probability, timeline, step count
- "Clone this GPS plan" button (purple)
- Extra rail button: "Clone" icon

### 4.4 My Goal snapshot card
- Deep green `#081408` background
- SVG circular progress ring (90px, teal fill)
- "Open active sprint" button (teal)

### 4.5 Achievement card
- Deep amber `#180f00` background, badge icon in amber circle
- Shows: $VLG earned, achievement title, OoWop for community validation

### 4.6 Guide card (new users, no goals)
- Deep indigo `#0d0b1a` background, Spirit sparkle icon
- 5-step system list
- "Create my first goal GPS" button
- Retired from feed after user creates first GPS

---

## 5. Right Action Rail (5 buttons, bottom-right)

### 5.1 Creator avatar (38px + follow button)
- Follow: small 16px circle with plus → toggles follow/unfollow

### 5.2 OoWop button
- 42px circle, raised fist icon
- Single tap: OoWop fires, count increments, amber color, haptic
- Double-tap video anywhere: also triggers OoWop + fist fly-up animation
- **Fist fly-up animation:** 64px amber fist, animates 180px up + scale 1→1.4, fades out, 700ms
- Earns 1 $VLG per card per user (server-side enforcement)
- API: POST `/api/oowop`, debounced 500ms

### 5.3 Skip button
- Thumbs down icon
- Marks "not helpful", card slides to next after 300ms
- Algorithm effect: 30% reduction in probability of showing to this user per skip, hidden after 3 skips
- API: POST `/api/feedback` with `{ cardId, signal: 'skip' }`

### 5.4 Comment button
- Opens comment drawer (70% screen height bottom sheet)
- Count shown below button

### 5.5 Share button
- Native device share sheet
- Deep link: `village://workshop/card/{cardId}`

### 5.6 Save button
- Bookmark icon → turns brand royal blue `#0033CC` when saved
- Saved cards accessible from Profile/Hut under "Saved" tab
- Spirit can reference saved videos when building GPS plans

---

## 6. Comment Drawer

- Bottom sheet, 70% screen height
- Handle bar at top (draggable to dismiss)
- Comment count header
- Scrollable comment list: avatar, username, timestamp, text, reply button, OoWop mini button
- Replies collapsed by default with expand
- Pinned input row: avatar + text field + "Post" button
- Keyboard adjusts sheet position up

---

## 7. Spirit Chat — GPS Creation Engine

### Route: `/village/workshop/chat`

### Layout
- Background: `#0a0a0f`
- Top bar: back arrow | "Spirit" | phase pill (right)
- Phase progress bar: 6 dots (teal done, purple active, dark pending) + phase labels

### 6 GPS Creation Phases

#### Phase 1 — Discovery (What)
Spirit asks 4 questions about the goal, reflects back, asks about prior attempts.

**Goal intersection detection:** if >50% semantic overlap with existing goal → Spirit offers to merge.
**Duplicate detection:** if >85% identical → Spirit asks to add to existing goal instead.

#### Phase 2 — Success (When)
Spirit defines measurable success criteria, deadline, commitment score 1-10. Below 7: Spirit asks what would make it 8-9.

#### Phase 3 — Proximity (Where)
Assesses starting point: skills, resources, team, what they already have.

#### Phase 4 — Resources (How)
Inventories what's needed: skills, tools, costs, hours/week, budget.
**Action level selector appears here** (see Section 7.1 below).

#### Phase 5 — Generating (Building)
Runs 7-agent wave system with animated status UI showing each agent completing.

If probability <70%: shows `pathTo95` guidance instead of sprints.
If 70-84%: offers user choice (generate with risk or address gaps first).
If ≥85%: generates sprints automatically.

#### Phase 6 — Launch (Ready)
GPS Ready Card displayed. User reviews and taps "Start my GPS" → countdown.

---

### 7.1 Action Level Selector (appears in Phase 4)

**Wayfinder (Level 1)** — "Every step, every detail"
Spirit writes everything — resume bullet by bullet, word for word, what to wear, how to fill out documents. User never guesses what to do next.

**Pathfinder (Level 2)** — "Guided, you lead"
Spirit gives overall action and asks if help is needed. User drives, Spirit jumps in where needed.

**Trailblazer (Level 3)** — "High-level, you decide"
Spirit gives action items, waits for verification. Help available but not offered unless asked.

---

### 7.2 Agent Wave System

**Wave 1 — 5 parallel agents:**
- Skills agent: user skills vs goal requirements → matchScore 0-100
- Funding agent: estimated cost vs budget → gap amount + funding options
- Team agent: support network assessment → teamStrength 0-100
- Time agent: hours available vs required → feasibility + adjusted timeline
- AI agent: broader feasibility, global goals database → feasibilityScore + insights

**Wave 2 — 2 parallel agents (after Wave 1):**
- Gap analysis agent: identifies specific actionable gaps (critical/major/minor)
- Probability agent: final score = avg(Wave1 scores) - gap penalties

**Wave 3 — Sprint generation (gated at 85%):**
Works backward from goal to present, groups milestones into 1-2 week Sprints, generates Actions with verification methods. Granularity adjusted by action level.

**Loading state UI:** Spirit avatar pulsing center, agent status rows animate in as each completes.

---

## 8. GPS Ready Card

Shows after Wave 3 completes:
- Goal title + probability pill + action level pill
- 3-stat grid: Timeline / Sprint count / Estimated cost
- "First moves" — 2 action preview cards
- "Spirit recommends" — horizontally scrollable affiliate product cards
- "You win when..." — success criteria checklist
- "Start my GPS" button → triggers countdown

---

## 9. Countdown Overlay

Full-screen overlay on "Start my GPS":
- Large circle (120px) with purple border
- Countdown: 3 "Get ready..." → 2 "Almost there..." → 1 "Let's go..." → 0 "Let's GO" 🚀
- After 800ms: fades out, Goal Detail page slides in
- GPS activated in DB: goal status=active, first Sprint=active, first Action=pending

---

## 10. Goal Detail Page

### Route: `/village/workshop/goal/{goalId}`

### 3 Internal Tabs

**GPS tab:**
- Sprint roadmap: horizontal scrollable circles (teal=done, purple=active, dark=pending)
- Gap analysis card: all agent outputs as rows with colored dots
- Recalibrate button
- Report a life event → Spirit adjusts plan

**Spirit tab:**
- Goal-scoped Spirit chat with full goal context
- Can explain low probability, give action help, guide goal revision

**Workshop tab:**
- Skill Stream filtered to current Sprint action's category

---

## 11. Sprint Execution Page

### Route: `/village/workshop/sprint/{sprintId}`

### Layout
- Sprint header: title, week dates, Mon-Sun day tracker, SVG progress ring (52px)
- Action list: checkbox circle + title + verification method + day estimate
- Wayfinder: "See full instructions" expands full step-by-step Spirit-written guide
- "Verify next action" button → verification flow

### Action Verification Flow
Methods: photo/video upload | screenshot | document upload | social URL | text description

**Spirit AI verification (Wayfinder):**
- Vision analysis for images
- Follow-up questions for text
- URL metadata check for social posts
- On success: checkbox fills teal with spring animation

### Sprint Completion Celebration
- Full-screen overlay: badge icon, "Sprint complete!", stats, $VLG earned, confetti
- Buttons: "Start next sprint" | "See my progress"

---

## 12. Goal DNA Templates

### Route: `/village/workshop/templates`

Extracted from completed goals (anonymized). Enriched with actual timeline, actual probability, user's success rating, deviations.

- Search + category filter + sort (popularity/probability/newest/fastest)
- Template detail modal with: description, 4-step preview, global stats (avg time, completion rate)
- "Quick clone" → skips Spirit chat, goes straight to countdown
- "Customize with Spirit" → loads template, runs shortened GPS flow

---

## 13. Skill Stream

### Route: `/village/workshop/skill-stream`

### Video scoring (mission score 0-100)
Claude scores each video against the action title and goal category.

**Format filter by action level:**
- Wayfinder: prefer >10min videos (+/- 15 points)
- Pathfinder: no preference
- Trailblazer: prefer <8min videos (+/- 10 points)

**Score display:**
- 85%+: green pill
- 70-84%: amber pill
- <70%: hidden from GPS feed, may show in browse
- Studio: "Studio pick" teal pill regardless

---

## 14. Database Schema

```sql
goals (id, user_id, title, description, category, action_level[1-3], gps_stage, probability_score, estimated_weeks, actual_weeks, budget_estimate, start_date, target_date, completed_at, intertwined_goal_id, wave1_results jsonb, wave2_results jsonb)

sprints (id, goal_id, title, objective, sprint_number, week_start, week_end, status[pending|active|complete], completed_at, badge_earned)

sprint_actions (id, sprint_id, title, description, order_index, estimated_days, status[pending|in_progress|pending_verification|complete], verification_method[photo|video|screenshot|document|social_url|text], verification_instructions, verification_data jsonb, verified_at, completed_at)

goal_templates (id, source_goal_id, title, category, description, probability_score, estimated_weeks, total_steps, completion_count, avg_actual_weeks, completion_rate, star_rating, is_public)

workshop_cards (id, card_type, source_id, title, category, creator_user_id, youtube_video_id, studio_video_id, mission_score, view_count, oowop_count, skip_count, comment_count, save_count, is_active)

card_interactions (id, user_id, card_id, interaction_type[oowop|skip|comment|share|save|complete|view])

vlg_transactions (id, user_id, amount, reason[oowop_earned|sprint_complete|goal_complete|action_verified], source_id)

spirit_conversations (id, user_id, goal_id, phase, messages jsonb, created_at, updated_at)
```

---

## 15. API Routes

```
GET  /api/workshop/feed
POST /api/workshop/oowop
POST /api/workshop/skip
POST /api/workshop/save
GET  /api/workshop/comments/:id
POST /api/workshop/comments
GET  /api/gps/action-content
POST /api/spirit/message
POST /api/spirit/run-agents
POST /api/spirit/generate-sprints
GET  /api/goals/:id
POST /api/goals
PUT  /api/goals/:id
GET  /api/sprints/:id
POST /api/actions/:id/verify
GET  /api/templates
GET  /api/templates/:id
POST /api/templates/:id/clone
GET  /api/skill-stream
POST /api/vlg/earn
```

---

## 16. Key UX Principles

1. **Feed is purposeful** — action context banner visible at all times, user always knows why they're watching this
2. **Verification is non-negotiable** — no action marks complete without proof
3. **Progress must always be visible** — ring, sprint tracker, probability score
4. **Spirit is a coach not a chatbot** — pushes back on vague answers, never generic
5. **Action level is a promise** — Wayfinder = Spirit writes every detail, no exceptions
6. **$VLG must feel earned** — proportional to effort (OoWop < action < sprint < goal)
7. **GPS must feel alive** — recalibrates on life events, probability moves as gaps close

---

## Spirit Connection

Spirit must know and have access to:
- User's active goals, current sprint, current action
- Probability score and gap analysis for each goal
- Workshop feed interactions (OoWops, saves, skips)
- Verification history and completion rate
- $VLG balance and earning history
- All pages in the app — Spirit is the connective intelligence across the entire platform
