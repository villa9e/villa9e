# VILLA9E — VISION LOG

The canonical, append-only record of the product vision. Every aspect of the
vision Legaci describes gets logged here so it can be recalled at any time and
built toward incrementally. **When the user describes a piece of the vision, add
a dated entry here** (and a dedicated `*_SPEC.md` if it's large).

Newest entries at the top. Each entry: date, title, summary, and a link to the
full spec when one exists.

---

## 2026-06-13 — Spirit OS: Spirit hard-wired to everything (Operating Intelligence)

Spirit shouldn't be a feature you open — it's the substrate the whole app
runs on. Vision describes Spirit as a hyper-personalized, context-aware,
multimodal **Operating Intelligence**, built from 4 layers: a **Perception
Engine** (voice/text/app-state/biometrics/calendar), a **Dynamic Context &
Memory Graph** (relational graph of the user's life, not a flat memory log),
a **Unified API Fabric** (one interface Spirit calls to act on any system,
internal or external), and an **Execution Layer** running a continuous
**Perceive → Reason → Orchestrate → Execute** loop (worked example: a flight
delay triggers an auto-rebooked dinner + rideshare). Security via a **Trust
Wall** — zero-knowledge token handling (villa9e already does this for
Google Calendar tokens) plus a "Gateway Guard" proxy for any third-party
plugins.

Translated into villa9e-specific, buildable phases (memory graph schema,
internal tool registry/Claude tool-use loop, Tier 0/1/2 action confirmation +
audit log, proactive cron-based perception, worked example using GPS
sprint-delay detection) → `SPIRIT_OS_SPEC.md`. This is the infrastructure
layer underneath the existing personality/RAG work in `spirit_phase_c` and
the SPIRIT CONNECTIVITY section of `TASKS.md`.

## 2026-06-12 — Remaining sections: Discover, Hut, Live, Map, Personality Maze, Spaces/Wellness/Zen, Notifications, Onboarding

Quick-fire vision for most of the rest of the coverage map:

- **Discover** = the search tool (magnifying glass). Already built (`app/village/discover/page.tsx`).
- **Hut** = the user profile. This *is* the "profile" coverage item — same page
  (`app/village/hut/page.tsx`), no separate surface needed.
- **Live** = the user's ability to go live, launched from the Creator Studio
  (`app/village/studio`). Not yet built — add to CREATOR STUDIO tasks in `TASKS.md`.
- **Map** (3D village world) = **intentionally on standby** — no updated spec yet.
  Leave uncaptured until Legaci describes it.
- **Personality Maze** = the 8-archetype mini-game (already built at
  `app/village/hut/personality/page.tsx`, result saved to `profiles.personality_type`)
  is the maze. **New mechanic**: Spirit uses each archetype's compatibility (`match`
  field) to pair villagers as **Trading Post partners** for tasks/deals that require
  collaboration — surfaced on the user's profile (archetype badge) and on
  partner-required Trading Post tasks ("Find your match"). → `PERSONALITY_MAZE_SPEC.md`.
- **Spaces / Wellness (incl. Zen)** = part of the Hut/profile bundle: swiping the
  profile screen right→left opens **Spaces**, swiping left→right opens **Wellness**
  (which includes **Zen** — already built under `app/village/zen/*`: meditate,
  breathwork, affirmation, music, journal). Trading Post, Wellness, Spaces, and Zen
  specs were already captured in the 2026-06-01 dump (`TASKS.md` SPACES/WELLNESS
  sections + cross-references across `BANK_SPEC.md`, `DREAMLINE_SPEC.md`,
  `GOAL_GPS_MAPS_SPEC.md`, `ADS_MANAGER_SPEC.md`, `MERCHANT_NETWORK_SPEC.md`,
  `SPIRIT_TOURS_SPEC.md`); no new spec needed.
- **Notifications** = one unified inbox for every notification type across the app.
  Already built (`app/village/notifications/page.tsx`) — routes/messages for
  oowop, Trading Post match, tribe message, GPS goal-step, tribe invite, system.
- **Onboarding** = the existing onboarding flow (`app/village/onboarding/` +
  `app/onboarding/welcome/`) is the captured vision — no further description pending.

## 2026-06-10 — ViCo coin economics, on-chain verification & GVS (major dump)

The full token economy, captured across several new specs:
- **ViCo coin** — 33M fixed supply, 4 conversion phases (halving), staking tiers
  (Proof-of-Stake Access not subscriptions), 20% revenue buyback-burn, Polygon→Village
  Chain, 15 resolved design answers, smart contracts, $VLG earning table. One sentence:
  "the first currency you mine with your own progress." → `VICO_COIN_SPEC.md`
- **Proof of Growth + GVS** — every verified action writes an on-chain Growth Receipt;
  goal completion issues an Achievement Credential (the on-chain resume for Trading Post);
  and the **Goal Value Score** scales $VLG to a goal's real difficulty (5 dimensions:
  complexity, effort, verification rigor, impact, completion rarity) so a SaaS launch
  earns far more than "drink more water." → `GROWTH_VERIFICATION_GVS_SPEC.md`
- **Investor path / founder scenarios / disruption & moonshot thesis** →
  `VICO_INVESTOR_ECONOMICS.md`

## 2026-06-10 — DreamLine, Super Admin, Spirit Tours (new section specs)

- **DreamLine** — goal-aware social feed (NOT TikTok): 5 audience tiers (mentor/alumni/
  protégé/tribe/discovery), eye-tracking engagement (on-device, consented), progress-as-
  content, mentorship comments. → `DREAMLINE_SPEC.md`
- **Super Admin dashboard** — Spirit AI as the org's chief-of-staff intelligence layer
  (persistent briefing panel, executive summaries, fraud detection, economy simulation).
  → `SUPER_ADMIN_SPEC.md`
- **Spirit-guided section tours** — personalized interactive walkthroughs for every
  section, with a hands-on moment each. → `SPIRIT_TOURS_SPEC.md`

> Note: the same dump also re-stated the full **Data Locker, Pavilion, ViCo Governance,
> Ads Manager, and Avatar Studio** specs — those already have files (see below). The
> pasted versions are the fuller canonical detail; refresh those files with it on request.

## 2026-06-10 — Goal GPS as a Google Maps–style map (signature surface)

**The GPS tab of the Workshop becomes a literal map.** The goal is the destination
flag, sprints are tappable waypoints, actions are turns, the route is solid behind
you / dashed ahead, probability colors the route like traffic, resources are
"gas-station" buildings along the way, and recalibration is "Recalculating…".

**The signature mechanic Maps doesn't have: verify = mine.** Passing a waypoint
requires proof → Spirit verifies → a Growth Receipt block is written on-chain → $VLG
drops into the wallet. Progress literally mints currency. At goal completion the full
chain of Growth Receipts compiles into an on-chain Achievement Credential.

Key sub-ideas: probability-as-traffic (gaps turn segments amber, tap → pathTo95);
things-needed-as-buildings (resource buildings are a revenue surface → Spirit
Recommends affiliate cards); mining-as-arrival-ritual; zoom levels (goal view →
sprint view → Wayfinder action instructions, like highway → street view).

→ **Full build spec:** [GOAL_GPS_MAPS_SPEC.md](./GOAL_GPS_MAPS_SPEC.md)
(16 sections — exact colors, timings, gestures, data model, APIs, component tree).

---

## 2026-06-10 — Workshop / goal navigation model ✅ IMPLEMENTED (2026-06-11/12)

> Done via commits `af86b47`, `4cf212e`, `93faf09`, `1dae769`, `24d59d8`. The Maps GPS page
> is live, shares the Goals|Workshop|GPS tab bar (animated underline via shared
> `WorkshopTabBar` component + framer-motion `layoutId`), left/right swipe nav works
> across all three pages, the you-are-here marker uses the user's profile picture
> (falls back to an arrow), and the old per-goal Spirit/Instructions tabs are removed.

- The Workshop section has three top-level tabs everywhere: **Goals | Workshop | GPS**.
  - **Goals** → the Spirit goal-building chat (`/village/workshop/chat`).
  - **Workshop** → the TikTok-style feed (`/village/workshop`).
  - **GPS** → the goal's GPS map (interim: the goal detail page; target: the Maps UI).
- The goal/GPS page mirrors these same tabs so swiping left/right between Workshop
  surfaces feels continuous.
- **Left-edge / right-swipe → back to Workshop** from the goal page.
- The old per-goal "Spirit" and "Instructions" tabs are removed; Spirit editing now
  happens through the chat threads, and step instructions live in the GPS view / an
  ⓘ info affordance.

---

## 2026-06-10 — Spirit goal chat: voice + threads ✅ IMPLEMENTED

> Confirmed live in `app/village/workshop/chat/page.tsx`: voice call (`SpiritVoiceCall`,
> `useSpeechRecognition`), color/voice selection, and chat threads via
> `spirit_chat_threads` (migration 048) with history + resume.

- **Voice conversation.** Users can talk to Spirit hands-free: a mic button in the
  chat bar (push-to-talk → transcribe → auto-send) and an immersive full-screen
  voice-call mode with an animated Spirit orb in the user's chosen color. Spirit
  speaks replies aloud (ElevenLabs, with a browser-TTS fallback when over quota).
- **Spirit appearance + voice are user-selectable:** color (white / villa9e blue /
  dark) and voice gender (male / female).
- **Free-form chat threads (ChatGPT-style history).** Conversations are saved; users
  see previous threads, resume them, and modify the resulting goal. Stored in
  `spirit_chat_threads` (migration 048).
- **After Spirit builds the GPS, the user is taken straight to the GPS page.**

---

## 2026-06-10 — Spirit personality + moral layer (existing, logged for recall)

- Spirit is the AI guide across the app. Personality + 77 Commandments moral layer +
  RAG memory architecture (see memory `spirit-phase-c`, `spirit-77-commandments`).
- Spirit never scolds — it recalibrates like a car GPS.

---

## Related spec documents (the rest of the vision, already written)

These live in `specs/` and are part of the vision; pull them in when working on the
relevant surface:

- `GOAL_GPS_MAPS_SPEC.md` — the Maps-style GPS page (above).
- `WORKSHOP_SPEC.md` — the Workshop section.
- `BANK_SPEC.md` — the Bank.
- `PLATFORM_SPEC.md` — platform-wide architecture.
- `CHAIN_EXPLORER_SPEC.md` — on-chain Growth Receipts / block explorer.
- `VICO_GOVERNANCE_SPEC.md` — $VICO governance.
- `AVATAR_STUDIO_SPEC.md`, `ADS_MANAGER_SPEC.md`, `MERCHANT_NETWORK_SPEC.md`,
  `PAVILION_SPEC.md`, `DATA_LOCKER_SPEC.md` — respective surfaces.
- `TASKS.md` — build task tracking.

---

## Coverage map — every section of the app

Tracks which surfaces have a written vision spec. Legaci is feeding each missing
one; mark `[x]` + link the spec as they're captured.

> **Reconciliation pass (2026-06-12):** Compared the 2026-06-10 "fuller restatement" of
> Data Locker, Pavilion, ViCo Governance, Ads Manager, and Avatar Studio against the
> existing 2026-06-03 spec files — **no material differences found** (same numbers,
> mechanics, routes; the dump was just fuller prose). No file refresh needed; treating
> as resolved. Going forward: before building any surface, still check recent
> conversation history for a newer spec and treat the most recent as canonical.

**Spec'd:**
- [x] workshop — `WORKSHOP_SPEC.md` + `GOAL_GPS_MAPS_SPEC.md` (GPS Maps page **built** 2026-06-11/12;
  remaining gaps: §6 reroute FAB has no `/api/gps/recalibrate` endpoint, §6 recenter FAB
  has no eased camera animation, §9.2 mining sequence has no real tx-hash/block-explorer
  visual, §9.3 wallet doesn't animate to server-returned balance)
- [x] bank — `BANK_SPEC.md`
- [x] ads — `ADS_MANAGER_SPEC.md`
- [x] studio (avatar) — `AVATAR_STUDIO_SPEC.md`
- [x] blockchain — `CHAIN_EXPLORER_SPEC.md` + `GROWTH_VERIFICATION_GVS_SPEC.md`
- [x] locker — `DATA_LOCKER_SPEC.md`
- [x] merchant — `MERCHANT_NETWORK_SPEC.md`
- [x] pavilion — `PAVILION_SPEC.md`
- [x] vico (governance) — `VICO_GOVERNANCE_SPEC.md`
- [x] vico (coin/economics) — `VICO_COIN_SPEC.md` + `VICO_INVESTOR_ECONOMICS.md`
- [x] dreamline — `DREAMLINE_SPEC.md`
- [x] admin — `SUPER_ADMIN_SPEC.md`
- [x] (cross-cutting) section tours — `SPIRIT_TOURS_SPEC.md`
- [x] _(platform-wide)_ — `PLATFORM_SPEC.md`
- [x] discover — search tool, built `app/village/discover/page.tsx`
- [x] hut / profile (`[username]`) — `app/village/hut/page.tsx`
- [x] live — go-live from Creator Studio (vision captured 2026-06-12, not yet built)
- [x] personality-maze — built maze + new Trading Post archetype-matching mechanic → `PERSONALITY_MAZE_SPEC.md`
- [x] spaces — partial spec in `TASKS.md`; swipe-right from Hut
- [x] wellness (incl. zen) — partial spec in `TASKS.md`; swipe-left from Hut; `app/village/zen/*` built
- [x] trading-post — covered via cross-references (`BANK_SPEC.md`, `DREAMLINE_SPEC.md`, `GOAL_GPS_MAPS_SPEC.md`, `ADS_MANAGER_SPEC.md`, `MERCHANT_NETWORK_SPEC.md`, `SPIRIT_TOURS_SPEC.md`) + `PERSONALITY_MAZE_SPEC.md` (new matching mechanic)
- [x] notifications — unified inbox, built `app/village/notifications/page.tsx`
- [x] onboarding — built `app/village/onboarding/` + `app/onboarding/welcome/`

**Not yet captured (awaiting Legaci's description):**
- [ ] create
- [ ] hospital
- [ ] map (3D village world) — intentionally on standby, no spec yet
- [ ] spirit (companion/personality — partial in memory)
- [ ] stories
- [ ] tribes

---

### How to use this log

1. New vision described by the user → append a dated entry at the top.
2. If it's large/detailed → also create `specs/<NAME>_SPEC.md` and link it here.
3. Before building any surface, read the relevant entry + its linked spec so the
   build matches the approved vision exactly (colors, timings, mechanics).
