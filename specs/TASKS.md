# Village Build Tasks
# Last updated: 2026-06-01
# Status: [ ] not started | [~] in progress | [x] complete | [!] blocked

---

## WORKSHOP

### Navigation
- [~] Teepee radial menu (built, needs 7th Bank item + animation polish per WORKSHOP_SPEC §2 — Bank item already present in BottomNav, 110px arc/40ms stagger/overlay still pending — large rewrite, deferred)
- [x] Remove any remaining tab bars that conflict with radial menu (audited — no conflicting tab bars found; WorkshopTabBar is the intentional Goals/Workshop/GPS swipe-tab structure, separate from the radial menu)
- [ ] Radial menu: arc radius 110px, spring stagger 40ms, overlay backdrop (current menu is a bottom-sheet grid, not a radial arc — large rewrite, deferred)

### Feed
- [~] Workshop/Goals/GPS tab structure (built today)
- [ ] Scroll-snap container (currently custom swipe, needs CSS scroll-snap)
- [x] Action context banner on every video card (Sprint/Action reference + title) — banner already existed on studio/YouTube cards; extended to TikTok/curated cards too so it's on every video card
- [x] OoWop fist fly-up animation (64px amber fist, 180px up, 700ms) — fist now rendered as an amber-masked 64px shape, animates 1→1.4 scale + 180px up, fades over 700ms
- [ ] Skip signal → algorithm effect (30% probability reduction, hide after 3)
- [x] Mission score pill on video cards (green 85%+, amber 70-84%)
- [x] Video scoring system: Claude scores YouTube/Studio videos against action title
- [x] Format filter by action level (Wayfinder prefers >10min, Trailblazer <8min) — new `goals.action_level` column (migration 060, applied), persisted from `gpsData.actionLevel` on goal creation; `/api/gps/action-content` uses it to set YouTube `videoDuration` (medium/long for Wayfinder, short for Trailblazer) and filters studio videos by `duration_seconds`
- [x] Card ordering algorithm (first card = current GPS action match) — already satisfied: when the user has a current GPS action, every video card (YouTube/studio/curated) gets `actionContext` attached and action-matched YouTube results lead the feed

### Comment Drawer
- [x] Comment drawer on main feed cards (CommentsDrawer in workshop/page.tsx, 78vh bottom sheet with OoWop row + input)
- [ ] Draggable bottom sheet (70% height) — currently fixed height, not user-draggable
- [ ] Reply threads (collapsed by default)
- [ ] Keyboard-aware positioning

### Spirit Chat
- [x] 6-phase flow built and wired (discovery → success/commitment → proximity → resources → generating → ready)
- [x] Goal intersection detection (>50% semantic overlap → offer to merge) — `checkDuplicate()` now computes a Jaccard-style similarity %; 50-84% shows new `OverlapAlert` ("Merge into existing" appends the new text to the existing goal's description and redirects, or "Keep separate" continues discovery)
- [x] Duplicate detection (>85% identical → redirect to existing goal) — same `checkDuplicate()`, >=85% shows the existing `DuplicateAlert` ("Build on existing" / "Create separate"), now gated on the 85% threshold instead of a raw word-count heuristic
- [x] Phase 1: Spirit asks 4 questions, not just 1 (`DISCOVERY_QUESTIONS` — greeting Q1 + 3 follow-ups before falling through to Phase 2)
- [x] Phase 2: commitment score 1-10, Spirit pushes back below 7 (`extractCommitmentScore` + `awaitingCommitment` gate)
- [x] Phase 4: Action level selector (Wayfinder/Pathfinder/Trailblazer inline cards) — `ActionLevelSelector` component
- [x] Agent wave system (built — `AgentWaveOverlay`/`AgentRowItem` rows animate in, pulse while running, turn green on done)
- [x] Agent loading state: each agent animates in as it completes
- [x] pathTo95 guidance screen (below 70% probability) — `PathTo95Screen` component
- [x] GPS Ready Card: affiliate products row, "You win when" checklist

### Countdown
- [x] Countdown overlay: spec-accurate sequence (3 "Get ready..." → 2 "Almost there..." → 1 "Let's go..." → 0 "Let's GO 🚀", 120px circle, 800ms hold before completing)

### Goal Detail
- [x] 4 internal tabs (GPS/Spirit/Instructions/Workshop) — GPS tab already replaces the old Instructions-first layout
- [x] GPS tab: sprint roadmap circles, gap analysis card with agent outputs (driven by `wave1_results`/`gpsData`, falls back to probability-derived rows)
- [x] Recalibrate button → re-runs relevant agents (`/api/goals/recalibrate` re-invokes Wave 1/2 agents)
- [x] Life events modal (12 event types → Spirit adjusts plan via `/api/gps/life-event`)

### Sprint Execution
- [x] Sprint page + verification flow (text/image/screenshot/document/social URL)
- [x] Action verification flow: photo/video/screenshot/document/social/text (`/api/actions/[id]/verify`)
- [x] Spirit AI verification for Wayfinder (Claude vision analysis on image uploads when `action_level === 1`)
- [x] Wayfinder instruction sheet (full step-by-step Spirit-written guide) — new `action_instruction_sheets` cache table (migration 061, applied) + `/api/workshop/action-instructions` (Claude-generated, cached per action); Wayfinder panel now has a "Get the full step-by-step guide" button that loads and displays it inline
- [x] Sprint completion celebration (confetti, badge, $VLG display) — `canvas-confetti` (120 particles, 80° spread, origin y=0.4) + `SprintCelebration` modal

### Goal DNA Templates
- [~] Templates page exists — needs "Customize with Spirit" flow
- [ ] Template enrichment: show actual timeline, completion rate, global stats (still `MOCK_TEMPLATES` with hardcoded stats when no real templates exist; real `goal_templates` rows are used when present but have no completion-rate aggregation)
- [x] "Quick clone" → countdown → Goal Detail (skip Spirit chat) — wired via new shared `CountdownOverlay` component, navigates to `/village/workshop/goal/{goalId}` on completion
- [ ] "Customize with Spirit" → Spirit chat pre-populated with template ("Customize First" currently routes to `/village/workshop?goal=title`, not a chat pre-populated with the template's steps)

### Skill Stream
- [x] Skill Stream page exists — mission scoring wired
- [x] Mission score per action (Claude API call per video+action pair) — wired via shared `lib/workshop/currentAction.ts` + /api/workshop/score-video, score pill renders on each video card
- [x] Score caching (avoid re-scoring same combination)
- [x] GPS-matched banner when user has active GPS (links to /village/workshop/gps/[goalId])

### $VLG
- [x] Wire OoWop → 1 $VLG earn (server-side, once per card per user — `/api/vlg/earn` now writes to `wallet_transactions` with a `wallet_tx_dedup` unique constraint so repeats are ignored)
- [x] Sprint completion → $VLG earn (sprint/[id]/page.tsx, +10)
- [x] Action verification → $VLG earn (actions/[id]/verify + submit-proof routes, +10)
- [x] Goal completion → $VLG earn (goal/[id]/page.tsx, +200)
- [x] VLG balance visible in profile (hut/page.tsx $VLG pill, own profile)

---

## BANK (see BANK_SPEC.md)

### Infrastructure (real external providers — not started, needs account/credential decisions)
- [ ] Unit BaaS account and API integration
- [ ] Alpaca Securities API integration
- [ ] Coinbase Prime API integration
- [ ] Polygon wallet + Ethers.js setup
- [ ] Persona KYC integration

### Pages (all built on internal Supabase ledger via /api/bank/*, Phase 1 "points mode" — real-money rails above are what's missing)
- [x] Bank Home Dashboard (Page 1) — app/village/bank/page.tsx
- [x] Send Money (Page 2) — app/village/bank/move/page.tsx
- [x] Receive Money (Page 3) — app/village/bank/receive/page.tsx
- [x] Invest - Stocks + Crypto (Page 4) — app/village/bank/invest/page.tsx + blockchain/page.tsx
- [x] Village Fund micro-trusts (Page 5) — app/village/bank/village-fund/page.tsx
- [x] Budget and Spending (Page 6) — app/village/bank/budget/page.tsx
- [x] Financial Goals (Page 7) — app/village/bank/goals/page.tsx
- [x] Financing and Lending (Page 8) — app/village/bank/finance/page.tsx
- [x] Direct Deposit (Page 9) — app/village/bank/direct-deposit/page.tsx
- [x] Financial Profile (Page 10) — app/village/bank/financial-profile/page.tsx
- [x] AI Financial Chat (Page 11) — app/village/bank/advisor/page.tsx
- [x] Statements and Tax Documents (Page 12) — app/village/bank/statements/page.tsx

---

## CREATOR STUDIO (in progress — see user spec)

- [x] Go Live — launch a live stream from Creator Studio (GoLivePanel sets `profiles.is_live` + routes to /village/live/[userId]; presence-flag live, no WebRTC/RTMP pipeline yet)
- [x] Camera opens in selfie mode by default
- [x] Music note icon (top left): Spotify API, audio overlay, user sounds (Spotify + User Sounds tabs use mock catalogs, not live API/uploads yet)
- [x] Teepee icon (top right): countdown timer, format selector, filters, background blur/polish AI, camera switch
- [x] Photo / Video / Text / Upload swipe selector (implemented as tabs, not a swipe gesture)
- [x] Video duration: 30s / 60s / Freeform (10min)
- [x] During recording: ONLY camera + stop + slow-motion + fast-motion buttons
- [x] Text editor: fonts, styles, highlights — visible while editing (fixed: drag transform now resets after each move, so overlay no longer drifts off-screen)
- [x] Audio tracks: working (My Sounds = device file picker, Sound Library = villa9e VILLAGE_SONGS catalog wired via setSound)
- [x] Trim: working (fixed Infinity-duration crash on recorded blobs + clamped/guarded trim values)
- [x] Captions: live in editor (fixed: new Captions tool lets you add/edit/delete timed segments at the playhead, burned-in preview on the video, saved to `post_transcripts.captions` immediately on publish — no longer "after posting")
- [ ] Full video editor per spec: timeline, playhead, tracks, cuts, transitions, keyframes (single-track trim timeline exists; no multi-track/cuts/transitions — large new subsystem)
- [ ] Effects: open source filters, zoom, face tracker, object tracker (CSS filter presets done; zoom + face/object tracking not started — needs ML e.g. MediaPipe)
- [x] Stickers: time, date, popular (open source library) (time/date/emoji stickers via text-overlay system; "popular" is a fixed emoji set, not a GIPHY/Lottie library)
- [x] Adjust: brightness, contrast, saturation, brilliance, sharpness, HSL, shadow, temp, tint, fade, vignette, grain (fixed: added brilliance/shadow/hue/tint sliders — all 12 params now in `Adjustments`)
- [x] Cover selection (still frame or upload) (fixed: new frame-scrubber modal lets you pick any video frame as cover, or upload an image)
- [x] Post details: description, hashtags, mentions, location, all toggles per spec (@Mention is a static label, not a functional mention picker yet)
- [x] Post type labeling: Workshop/DreamLine/Story + content type labels (DreamLine label pills + content-type labels + Workshop toggle implemented; no distinct "Story" post-destination type)
- [x] After posting: redirect to DreamLine while content uploads
- [ ] Footer menu: must not overlap content, items spread out further (no overlap in create flow since it's full-screen over BottomNav; "spread out further" spacing not yet revisited)

---

## PROFILE PAGE

- [x] Header: username, add friend (+), health shortcut (green heart), spaces shortcut (calendar), more (⋯)
- [x] Avatar + story ring (green border if active stories, 24hr expiry)
- [x] Stats: following, tribe count, total OoWops
- [x] Bio counts: Verification / Success (sprints) / Testimonials / Deals (fixed: Verified count now reads real `action_verifications` rows instead of hardcoded 0)
- [x] Trading Post store link (if store exists)
- [x] Action buttons: Follow (red) / Message / Dropdown (implemented as Add Friend/Connected/Pending + Message; Dropdown = header "⋯" MoreMenu — connections-based model, not literal "Follow")
- [x] Highlights/Playlists row
- [x] Content tabs: Grid / Repost-Series / OoWop content (Repost tab is a placeholder — "No reposts yet")
- [x] Video grid: 3-column, view count overlay, pinned (up to 3), Drafts first for owner
- [x] Swipe right → Spaces Calendar
- [x] Swipe left → Wellness (via /village/hospital → redirects to /village/wellness)

---

## SPACES

- [x] Trigger system: fires automatically before calendar events (`SpacesTriggerWatcher` global component polls `calendar_events` and auto-navigates to /village/spaces/trigger when `now >= start_time - trigger_min`)
- [x] 5 Trigger profiles: High Performance / Focused / Creative / Energize / Calm
- [ ] AI dynamically adjusts Trigger based on daily wellness data
- [x] Trigger screen: dark, countdown, affirmation, music card, prep checklist, focus sentence
- [x] Spaces home: Next up card, Trigger status bar, Today/Tomorrow event lists
- [x] Event detail: event info, Trigger details, linked files (mock), affirmation, "Start Trigger now"
- [x] Tasks page: Today / Upcoming / Projects
- [x] Calendar page: colored energy borders/pills + TRIGGER badge per event
- [x] Settings: Trigger defaults, 5 profile editors (now fully editable — migration 059 + ProfileCard rewrite)
- [ ] Nextcloud CalDAV sync
- [ ] AppFlowy integration for tasks/projects
- [ ] n8n automation: calendar event → Trigger fires → music + notification

---

## WELLNESS (partial)

- [x] Readiness score: AI synthesizes mood/energy/stress/focus into a readiness score (`/api/wellness/insight`, `wellness_logs.readiness`) — sleep/HRV/RHR not included pending wearable ingestion (item 8), and it's computed on page load rather than a scheduled "every morning" job
- [ ] Vital stat tiles: Sleep / RHR / HRV / SpO2 / Steps / Stress (body/page.tsx renders all 6 tiles, but only Stress reads real data — Sleep/RHR/HRV/SpO2/Steps are "Connect wearable" placeholders pending item 8)
- [x] AI daily insight (uses Claude API, not local BioMistral — architectural substitution, see INFRASTRUCTURE)
- [x] Nutrition: AI meal planning based on schedule + health data + chronobiology (`/api/wellness/nutrition` now receives today's real `calendar_events` as `schedule`, plus readiness/mood)
- [ ] HAPI FHIR health records server
- [ ] Telehealth: Jitsi embedded video room, pre-visit AI brief (Jitsi link generation exists under /village/hospital booking flow, but not embedded in Wellness and no pre-visit AI brief)
- [ ] Foundation: values/purpose editor, morning intention, gratitude log (gratitude log works in journal/page.tsx; values/purpose editor + morning intention not built)
- [ ] Wearable: Gadgetbridge (Android) + Apple Health (iOS) → n8n → normalized DB
- [ ] Medito integration (meditation)
- [ ] Moodist integration (ambient sound)

---

## SPIRIT CONNECTIVITY

- [x] Spirit reads ALL sections: goals, bank, wellness, spaces, trading post, profile, workshop (`fetchSpiritContext`)
- [x] Spirit available on every page (floating icon or section-specific chat)
- [x] Spirit has context of entire app state when answering any question
- [x] Spirit uses 77 Commandments as moral framework
- [x] Spirit memory: RAG via pgvector (spirit_memories table)
- [x] Spirit collective intelligence (spirit_collective table)

### Spirit OS — Operating Intelligence (see SPIRIT_OS_SPEC.md, vision logged 2026-06-13)

- [x] Phase 1 — Memory graph: `spirit_entities` + `spirit_relationships` tables (migration 053, applied)
- [x] Phase 2 — Unified API Fabric: internal tool registry (`lib/claude/spirit-tools.ts`) + Claude tool-use loop in `callSpirit()`
- [x] Phase 3 — Execution Layer: Tier 0/1/2 action model, `spirit_actions` audit table, Tier-2 confirmation UI (`SpiritActivityFeed` on Hut)
- [x] Phase 4 — Proactive perception: `/api/spirit/tick` cron (daily, vercel.json), GPS-sprint-delay worked example end to end
- [ ] Phase 5 (long-horizon) — External plugin Gateway Guard, wearable/3rd-party API fabric

---

## INFRASTRUCTURE

- [x] Supabase migrations 035 + 036 applied (035 finished via migration 056; 036 reworked as migration 057 with `deals`→`investor_deals` rename to resolve schema collision with Trading Post trade-deals)
- [x] Studio-videos storage bucket created
- [ ] n8n self-hosted instance configured
- [ ] Nextcloud instance configured
- [ ] Ollama + BioMistral local inference
- [x] Anthropic API credits restored — verified live 2026-06-13, Spirit + GPS unblocked
# Wed Jun  3 16:36:14 PDT 2026
