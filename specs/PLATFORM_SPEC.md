# The Village — Master Platform Specification
# Source: User vision document. DO NOT delete or modify without updating the corresponding code.
# Last updated: 2026-06-01

## What The Village Is
A unified super app — ONE system with one data layer, one identity layer, one AI layer (Spirit), one automation layer. Five distinct visual environments serving different dimensions of the user's life. Nothing siloed. A connection in Tribe appears in all sections. A meeting in Office appears in Spaces. A course in Market unlocks in Pavilion.

## The Five Sections
1. **Spaces** — personal operating system: calendar, tasks, projects, Trigger performance prep, AI insights
2. **Wellness** — physical, mental, nutritional health (7 layers)
3. **Trading Post** — commerce, community, investment, collaboration (Deals/Market/Tribe/Office)
4. **Pavilion** — content, learning, live events
5. **Profile** — identity, credentials, reputation, settings

**Bank** is the sixth major section (see BANK_SPEC.md).
**Workshop** is the goal achievement engine integrated throughout (see WORKSHOP_SPEC.md).

## Brand Identity
Logo: teepee/tent icon, bold royal blue on cobalt blue circle background.
Tagline: "It takes a village."
Mechanic: OoWop (not OoWhop) — the validation/fist bump mechanic. Earned $VLG tokens.

## Color System (see globals.css)
Already implemented. Day: white + royal blue `#2952E8`. Night: deep navy `#080E24` + `#4D72FF`.
Bank section has its own teal-navy palette (see BANK_SPEC.md).
Trading Post uses gold accent. Workshop uses dark/immersive always.

## Navigation
**Global nav:** Single teepee button bottom center → radial arc menu (7 items per WORKSHOP_SPEC.md).
**Section nav:** Each section has its own internal tab bar.
**No top-level navigation bar** — everything is inside the radial menu.

## Spirit AI — The Connective Intelligence
Spirit is NOT a chatbot. Spirit is an AI coach and advisor connected to EVERY section of the app.

Spirit knows:
- User's active goals, current sprint, current action, GPS probability
- Financial picture (balances, budget, goals, investments)
- Wellness data (readiness score, HRV, sleep, mood, nutrition)
- Spaces calendar (upcoming events, Trigger profiles)
- Trading Post activity (deals, tribe connections, office meetings)
- Profile and credentials
- Workshop history (completed actions, OoWops, saved videos)

Spirit appears:
- Workshop: GPS creation, goal coaching, action instructions
- Bank: financial insight card, AI financial chat, loan eligibility
- Wellness: AI health chat, daily insight, nutrition recommendations, pre-visit briefs
- Spaces: Trigger affirmations, daily readiness, event prep
- Profile: credential verification AI layer
- Trading Post: deal analysis, pass feedback categorization, credential verification

Spirit personality: empathetic, warm, never clinical or generic. Best friend who knows everything about you. 77 Commandments as moral framework (see spirit_77_commandments.md memory).

## Creator Flow (/village/create)
When user taps Create in the radial menu:
1. Camera opens in selfie mode
2. Top-left: music note icon (add sound: audio overlay, Spotify music, user-generated sounds)
3. Top-right: Village teepee logo → taps opens dropdown with: countdown timer (3-10s), format selector (split top/bottom or full screen), filter, background blur/polish AI, front/back camera switch. All icons white.
4. Bottom center: big red record button. Above it: swipe between Photo / Video / Text / Upload
5. Video duration options: 30s / 60s / Freeform (up to 10min)
6. During recording: ONLY camera feed + stop button + slow-motion left + fast-motion right
7. After capture: full-screen content + swipeable top edit menu (gear, share, editor, etc.)

Post type labels (gear menu): Workshop toggle (affiliate/no affiliate), DreamLine, Story. Content type: workshop how-to, goal recap, action, sprint update, general post, ask for help.

Content editor: full video editor with timeline, playhead, A-roll/B-roll, cuts, text layers (fonts/styles/highlights), filters (open source), effects (zoom, face tracker, object tracker), captions (from AI transcript), overlay photos/videos, stickers (time/date/popular), color grading (brightness, contrast, saturation, brilliance, sharpness, HSL, shadow, temp, tint, fade, vignette, grain).

Post details screen: cover selection (still frame or upload), description, hashtags, mentions, location, content disclosure toggles, affiliate link, ad manager link, audience settings, allow comments/remixes, copyright check, save to device, watermark, language selection.

## Spaces — Trigger System
Trigger = 5-15 minute pre-event activation window that fires automatically before any calendar event.

**5 Trigger profiles:**
- High performance — pitches, presentations, high-stakes conversations
- Focused — deep work, writing, concentration blocks
- Creative — brainstorms, design sessions
- Energize — workouts, physical activity
- Calm — therapy, difficult conversations, recovery days

AI dynamically adjusts each Trigger based on daily wellness data:
- Poor sleep → extend to 15min, grounding protocols, lower tempo music
- High HRV + strong mood → shorten to 5min, bold activation
- Skipped breakfast before high-performance event → add food prompt to checklist

**Trigger screen content:**
1. Dark immersive header with live countdown timer
2. Event name
3. Affirmation (event-specific, grounded in user's stated values from Foundation layer)
4. Now playing card (music matched to energy type)
5. Prep checklist: Body (movement) + Mind (breathwork) + Space (environment)
6. Focus sentence (one bold line: exactly what success looks like for this event)

## Wellness — 7 Layers
1. Physical data (wearables via Gadgetbridge/Apple Health)
2. Mental and emotional (mood check-ins, journaling, Medito, Moodist)
3. Nutrition (Open Food Facts, AI meal planning, chronobiology-based)
4. Performance and preparation (Trigger system)
5. Health records (HAPI FHIR, OpenEMR, telehealth via Jitsi)
6. AI intelligence (Ollama + BioMistral, LlamaIndex, LangChain — ALL LOCAL, never external)
7. Spiritual and intentional living (Foundation section, morning intention, gratitude, values)

## User Profile Page
Header: username, add friend (+), health shortcut (green heart), spaces shortcut (calendar icon), more (⋯)
Avatar + Stats: profile photo | following count | tribe count | total OoWops
Story ring: green border if user has active stories (24hr expiry)
Bio counts: Verification count | Success count (sprints completed) | Testimonial count | Deals count
Action buttons: Follow (red) | Message | Dropdown (testimonial, notifications, add to Tribe)
Highlights/Playlists: horizontally scrollable circles with labels
Content tabs: Grid | Repost/Series | OoWop content
Video grid: 3-column, view count overlay, pinned videos (up to 3)
Drafts: first item in grid for logged-in owner
Swipe right → Spaces Calendar
Swipe left → Wellness

## Trading Post — Already Built
See existing code. Deals, Market, Tribe, Office all built. Refinements needed per detailed spec.

## Pavilion — Not Yet Built
Content, live events, learning, video platform.
Day: white + periwinkle borders. Live pill = danger red. Course progress = brand primary blue.
Night: deep navy + elevated navy cards.

## Open Source Stack
- Jitsi (video calls), Matrix/Synapse (messaging), Nextcloud (files/calendar), AppFlowy (workspace)
- Meilisearch (search), n8n (automation), Ollama + BioMistral (local AI)
- LlamaIndex + LangChain (AI orchestration), HAPI FHIR (health records)
- Hardhat + Ethers.js + Polygon (blockchain), DocuSeal (e-signatures), OpenLaw (legal)
- Victory Native (charts), Medito (meditation), Moodist (ambient sound)
- Open Food Facts (nutrition), Gadgetbridge (wearable Android), PDF.js, Collabora Online
- Cal.com (scheduling), PeerTube (video), ntfy (notifications), PostHog (analytics)
- Stripe Atlas (LLC formation), Persona (KYC), Sumsub (investor verification)
