# Village Build Tasks
# Last updated: 2026-06-01
# Status: [ ] not started | [~] in progress | [x] complete | [!] blocked

---

## WORKSHOP

### Navigation
- [~] Teepee radial menu (built, needs 7th Bank item + animation polish per WORKSHOP_SPEC §2)
- [ ] Remove any remaining tab bars that conflict with radial menu
- [ ] Radial menu: arc radius 110px, spring stagger 40ms, overlay backdrop

### Feed
- [~] Workshop/Goals/GPS tab structure (built today)
- [ ] Scroll-snap container (currently custom swipe, needs CSS scroll-snap)
- [ ] Action context banner on every video card (Sprint/Action reference + title)
- [ ] OoWop fist fly-up animation (64px amber fist, 180px up, 700ms)
- [ ] Skip signal → algorithm effect (30% probability reduction, hide after 3)
- [ ] Mission score pill on video cards (green 85%+, amber 70-84%)
- [ ] Video scoring system: Claude scores YouTube/Studio videos against action title
- [ ] Format filter by action level (Wayfinder prefers >10min, Trailblazer <8min)
- [ ] Card ordering algorithm (first card = current GPS action match)

### Comment Drawer
- [~] Comment drawer exists on goal detail page — needs to move to main feed cards
- [ ] Draggable bottom sheet (70% height)
- [ ] Reply threads (collapsed by default)
- [ ] Keyboard-aware positioning

### Spirit Chat
- [~] 6-phase flow built (needs polish and all phases fully wired)
- [ ] Goal intersection detection (>50% semantic overlap → offer to merge)
- [ ] Duplicate detection (>85% identical → redirect to existing goal)
- [ ] Phase 1: Spirit asks 4 questions, not just 1
- [ ] Phase 2: commitment score 1-10, Spirit pushes back below 7
- [ ] Phase 4: Action level selector (Wayfinder/Pathfinder/Trailblazer inline cards)
- [~] Agent wave system (built but needs UI animation per spec)
- [ ] Agent loading state: each agent animates in as it completes
- [ ] pathTo95 guidance screen (below 70% probability)
- [ ] GPS Ready Card: affiliate products row, "You win when" checklist

### Countdown
- [~] Countdown overlay exists — needs spec-accurate sequence (3→2→1→"Let's GO")

### Goal Detail
- [~] 3 internal tabs (Spirit/Instructions/Workshop) — needs GPS tab replacing Instructions
- [ ] GPS tab: sprint roadmap circles, gap analysis card with agent outputs
- [ ] Recalibrate button → re-runs relevant agents
- [ ] Life events modal (12 event types → Spirit adjusts plan)

### Sprint Execution
- [~] Sprint page exists — needs verification flow
- [ ] Action verification flow: photo/video/screenshot/document/social/text
- [ ] Spirit AI verification for Wayfinder (vision analysis on uploads)
- [ ] Wayfinder instruction sheet (full step-by-step Spirit-written guide)
- [ ] Sprint completion celebration (confetti, badge, $VLG display)

### Goal DNA Templates
- [~] Templates page exists — needs "Customize with Spirit" flow
- [ ] Template enrichment: show actual timeline, completion rate, global stats
- [ ] "Quick clone" → countdown → Goal Detail (skip Spirit chat)
- [ ] "Customize with Spirit" → Spirit chat pre-populated with template

### Skill Stream
- [~] Skill Stream page exists — needs mission scoring
- [ ] Mission score per action (Claude API call per video+action pair)
- [ ] Score caching (avoid re-scoring same combination)
- [ ] GPS-matched banner when user has active GPS

### $VLG
- [ ] Wire OoWop → 1 $VLG earn (server-side, once per card per user)
- [ ] Sprint completion → $VLG earn
- [ ] Action verification → $VLG earn
- [ ] Goal completion → $VLG earn
- [ ] VLG balance visible in profile

---

## BANK (Not yet built — see BANK_SPEC.md)

### Infrastructure
- [ ] Unit BaaS account and API integration
- [ ] Alpaca Securities API integration
- [ ] Coinbase Prime API integration
- [ ] Polygon wallet + Ethers.js setup
- [ ] Persona KYC integration

### Pages
- [ ] Bank Home Dashboard (Page 1)
- [ ] Send Money (Page 2)
- [ ] Receive Money (Page 3)
- [ ] Invest - Stocks + Crypto (Page 4)
- [ ] Village Fund micro-trusts (Page 5)
- [ ] Budget and Spending (Page 6)
- [ ] Financial Goals (Page 7)
- [ ] Financing and Lending (Page 8)
- [ ] Direct Deposit (Page 9)
- [ ] Financial Profile (Page 10)
- [ ] AI Financial Chat (Page 11)
- [ ] Statements and Tax Documents (Page 12)

---

## CREATOR STUDIO (in progress — see user spec)

- [ ] Go Live — launch a live stream from Creator Studio (see VISION_LOG 2026-06-12)
- [ ] Camera opens in selfie mode by default
- [ ] Music note icon (top left): Spotify API, audio overlay, user sounds
- [ ] Teepee icon (top right): countdown timer, format selector, filters, background blur/polish AI, camera switch
- [ ] Photo / Video / Text / Upload swipe selector
- [ ] Video duration: 30s / 60s / Freeform (10min)
- [ ] During recording: ONLY camera + stop + slow-motion + fast-motion buttons
- [ ] Text editor: fonts, styles, highlights — visible while editing (bug: text disappears on move, FIX)
- [ ] Audio tracks: working (currently broken, FIX)
- [ ] Trim: working (currently crashes, FIX)
- [ ] Captions: live in editor (not after posting — user explicitly rejected post-posting captions)
- [ ] Full video editor per spec: timeline, playhead, tracks, cuts, transitions, keyframes
- [ ] Effects: open source filters, zoom, face tracker, object tracker
- [ ] Stickers: time, date, popular (open source library)
- [ ] Adjust: brightness, contrast, saturation, brilliance, sharpness, HSL, shadow, temp, tint, fade, vignette, grain
- [ ] Cover selection (still frame or upload)
- [ ] Post details: description, hashtags, mentions, location, all toggles per spec
- [ ] Post type labeling: Workshop/DreamLine/Story + content type labels
- [ ] After posting: redirect to DreamLine while content uploads
- [ ] Footer menu: must not overlap content, items spread out further

---

## PROFILE PAGE (needs work)

- [ ] Header: username, add friend (+), health shortcut (green heart), spaces shortcut (calendar), more (⋯)
- [ ] Avatar + story ring (green border if active stories, 24hr expiry)
- [ ] Stats: following, tribe count, total OoWops
- [ ] Bio counts: Verification / Success (sprints) / Testimonials / Deals
- [ ] Trading Post store link (if store exists)
- [ ] Action buttons: Follow (red) / Message / Dropdown
- [ ] Highlights/Playlists row
- [ ] Content tabs: Grid / Repost-Series / OoWop content
- [ ] Video grid: 3-column, view count overlay, pinned (up to 3), Drafts first for owner
- [ ] Swipe right → Spaces Calendar
- [ ] Swipe left → Wellness

---

## SPACES (partial)

- [ ] Trigger system: fires automatically before calendar events
- [ ] 5 Trigger profiles: High Performance / Focused / Creative / Energize / Calm
- [ ] AI dynamically adjusts Trigger based on daily wellness data
- [ ] Trigger screen: dark, countdown, affirmation, music card, prep checklist, focus sentence
- [ ] Spaces home: Next up card, Trigger status bar, Today/Tomorrow event lists
- [ ] Event detail: event info, Trigger details, linked files, affirmation, "Start Trigger now"
- [ ] Tasks page: Today / Upcoming / Projects
- [ ] Calendar page: week strip with colored borders, Trigger badge per event
- [ ] Settings: Trigger defaults, 4 profile editors
- [ ] Nextcloud CalDAV sync
- [ ] AppFlowy integration for tasks/projects
- [ ] n8n automation: calendar event → Trigger fires → music + notification

---

## WELLNESS (partial)

- [ ] Readiness score: AI synthesizes sleep + HRV + RHR + mood every morning
- [ ] Vital stat tiles: Sleep / RHR / HRV / SpO2 / Steps / Stress
- [ ] AI daily insight (BioMistral local, no external data)
- [ ] Nutrition: AI meal planning based on schedule + health data + chronobiology
- [ ] HAPI FHIR health records server
- [ ] Telehealth: Jitsi embedded video room, pre-visit AI brief
- [ ] Foundation: values/purpose editor, morning intention, gratitude log
- [ ] Wearable: Gadgetbridge (Android) + Apple Health (iOS) → n8n → normalized DB
- [ ] Medito integration (meditation)
- [ ] Moodist integration (ambient sound)

---

## SPIRIT CONNECTIVITY

- [ ] Spirit reads ALL sections: goals, bank, wellness, spaces, trading post, profile, workshop
- [ ] Spirit available on every page (floating icon or section-specific chat)
- [ ] Spirit has context of entire app state when answering any question
- [ ] Spirit uses 77 Commandments as moral framework
- [ ] Spirit memory: RAG via pgvector (spirit_memories table)
- [ ] Spirit collective intelligence (spirit_collective table)

---

## INFRASTRUCTURE

- [ ] Supabase migrations 035 + 036 applied (user running manually)
- [ ] Studio-videos storage bucket created
- [ ] n8n self-hosted instance configured
- [ ] Nextcloud instance configured
- [ ] Ollama + BioMistral local inference
- [ ] Anthropic API credits restored (blocked: Spirit + GPS dead)
# Wed Jun  3 16:36:14 PDT 2026
