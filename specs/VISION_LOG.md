# VILLA9E — VISION LOG

The canonical, append-only record of the product vision. Every aspect of the
vision Legaci describes gets logged here so it can be recalled at any time and
built toward incrementally. **When the user describes a piece of the vision, add
a dated entry here** (and a dedicated `*_SPEC.md` if it's large).

Newest entries at the top. Each entry: date, title, summary, and a link to the
full spec when one exists.

---

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

## 2026-06-10 — Workshop / goal navigation model

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

## 2026-06-10 — Spirit goal chat: voice + threads

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

### How to use this log

1. New vision described by the user → append a dated entry at the top.
2. If it's large/detailed → also create `specs/<NAME>_SPEC.md` and link it here.
3. Before building any surface, read the relevant entry + its linked spec so the
   build matches the approved vision exactly (colors, timings, mechanics).
