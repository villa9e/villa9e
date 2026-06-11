# SPIRIT-GUIDED SECTION TOURS — SPECIFICATION

> Logged 2026-06-10. Every time a user enters a section for the first time (or taps the
> tour button), Spirit gives a **personalized, interactive walkthrough** tailored to who
> they are, their goals, and the section. Not generic tooltips — a conversation.

Applies to every section: Workshop, DreamLine, Create, Trading Post (+ sub-sections),
Bank (+ sub), Wellness, Spaces, Profile/Hut, Avatar Studio, Pavilion, ViCo Governance,
Merchant Network.

## Trigger conditions
1. **First visit** (tracked in `user_section_visits`).
2. **Major update** → existing users get a "What's new" update instead of full tour.
3. **User request** — `ti-help-circle` in every section's top bar restarts the tour.
4. **Contextual** — Spirit detects the user is stuck (visited 3+ times without completing
   a primary action) and proactively offers the tour.

## Tour anatomy (same structure every section)
1. **Spirit entrance (500ms)** — avatar slides up from bottom, gentle haptic, bottom sheet
   rises to 35% of screen.
2. **Personalized opening** — greets by name, connects the section to something they care
   about ("Hey [name] — you're in Workshop for the first time… You've got a business goal,
   right? Let me show you how to build a GPS for it in ~3 minutes."). Adapts if no active goal.
3. **Highlight steps** — spotlight overlay (rgba(0,0,0,0.6) with a cutout), Spirit explains
   each element, Next button, Skip always present. NON-blocking — the user can tap the
   highlighted element and Spirit responds (it's a conversation, not a wall).
4. **Hands-on moment** — at least one step asks the user to actually DO something ("Type
   your goal here and watch what Spirit does"). Active learning, not passive watching.
5. **Completion** — personalized CTA + "Let's go" button → the section's primary action +
   "Bookmark this tour" to the help library.

## Section tours (step counts + flavor)
- **Workshop (7):** feed is GPS-matched not random → swipe up/right gestures → OoWop earns
  $VLG + tunes feed → purple action banner → verify to mine ViCo → Goal DNA templates →
  hands-on: tell Spirit your goal. Personalized opening by goal state.
- **Spirit GPS chat (5):** I'm your strategist → answer honestly → 7 parallel agents work
  live → probability score (85%+ launches) → hands-on: type your goal.
- **DreamLine (6):** community of real builders → mentor badges explain why you see a post
  → OoWop → Alumni gold badge in comments → share progress → hands-on: OoWop this post.
- **Create (6):** record/photo/text/upload → logo menu for camera settings → record button
  + slow/fast → edit icon → auto captions edited pre-post → label content type (Workshop vs
  DreamLine).
- **Trading Post (6 + sub-tours):** Deals/Market/Tribe/Office overview → each explained →
  hands-on: choose one → Deals sub-tour (4), Market sub-tour (4).
- **Bank (7):** real FDIC account → send/receive → invest (Alpaca stocks, Coinbase crypto)
  → Village Funds → $VICO wallet (convert $VLG) → financial goals automate saving →
  hands-on: connect account.
- **Wellness (5):** reads wearable, stays on device → readiness score → 10s check-in earns
  $VLG (hands-on) → AI health chat (pattern spotting, not a doctor) → connect wearable.
- **Spaces (5):** calendar + tasks + Trigger ritual → Triggers fire before events →
  Trigger plays music/affirmation/checklist → tasks sync with GPS sprints → hands-on: add
  an event.
- **Pavilion (5):** streaming platform → Free section legal-free forever → live ticketed
  events → creator originals earn $VLG to watch → hands-on: tap a title.
- **ViCo Governance (5):** vote on platform rules → 2,000 staked to vote / 10,000 to
  propose → 3-day discussion + 7-day vote, 60% threshold → 5% vote cap (not even founders)
  → all on-chain.
- **Avatar Studio (4):** build avatar → customization tabs → badges earned not bought →
  hands-on: pick a style.

## Technical
**DB:** `user_section_visits` (section, first_visited_at, tour_completed/skipped_at,
completion_pct, times_toured), `tour_step_completions` (step_index, hands_on_action_taken).
**Component:** `<SpiritTour section steps onComplete>` — Overlay with cutout (allows tapping
highlighted element), BottomSheet (SpiritAvatar, step text, hands-on prompt, Skip/Next/
"Let's go", ProgressDots).
**Hook:** `useSpiritTour(section)` — shows on first visit, or 3+ visits without primary
action.
**APIs:** `GET /api/tours/{section}/status`, `POST .../visit|complete|skip`,
`POST .../step/{index}/complete`.

**Philosophy (shared with Super Admin):** intelligence embedded in the experience. A tour
that says "OoWop earns $VLG and teaches Spirit what to show you next" teaches the SYSTEM,
not just a feature. See [[project-villa9e-vision-log]], SUPER_ADMIN_SPEC.md.
