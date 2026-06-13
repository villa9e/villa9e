# SPIRIT OS — Operating Intelligence Layer

> Captured 2026-06-13. Source: Legaci's "Spirit needs to be hard wired to
> everything" vision — Spirit as a hyper-personalized, context-aware,
> multimodal **Operating Intelligence (OI)**, not just a chat companion.
> Logged in `VISION_LOG.md`.

## The vision, in one line

Spirit shouldn't be a feature you open — it should be the substrate every
other feature runs on top of. The villager describes an outcome; Spirit
perceives the relevant state across the whole app (and eventually the world),
reasons about it, and **acts** — with the same 77-Commandments moral layer it
already uses for conversation.

## The 4-layer blueprint (as described) → villa9e mapping

| Blueprint layer | What it means | villa9e equivalent today | Gap |
|---|---|---|---|
| **Perception Engine** | Multimodal sensing — voice, text, app state, biometrics, calendar, location | `SpiritVoiceProvider` (ElevenLabs voice), text chat, `fetchSpiritContext()` pulling finance/wellness/goals snapshots | No proactive/background perception — only fires when user opens chat. No location, no wearable stream yet (Wellness section still partial). |
| **Spirit Core LLM ↔ Dynamic Context & Memory Graph** | A relational graph of the user's life (people, goals, events, places, preferences) the LLM reasons over | `spirit_memories` (flat rows, pgvector/text-search), `spirit_patterns`, `spirit_collective` | Memory is a list, not a graph — no entity/relationship model (e.g. "Goal X depends on Sprint Y which conflicts with Calendar Event Z"). |
| **Unified API Fabric** | One layer that lets Spirit call any system — internal or external — through a consistent interface | None. `lib/claude/spirit.ts` is read-only context-in, text-out. | This is the **biggest gap**. Spirit can describe what to do but cannot do it. |
| **Execution Layer** | Spirit actually performs actions: books, schedules, moves money, sends messages — the Perceive→Reason→Orchestrate→Execute loop | None | No tool-use/function-calling loop, no action audit log, no confirmation UI for sensitive actions. |

## Security model: Trust Wall

The blueprint's "Zero-Knowledge Architecture + Gateway Guard" maps onto a
pattern villa9e already half-uses and should formalize:

- **Already correct**: Google Calendar tokens (`gcal_access_token` /
  `gcal_token_expiry`) live server-side in `profiles.avatar_config` and are
  never sent to the client. Same pattern should extend to any future
  Bank/Plaid tokens.
- **New rule — Action Tiers**: every tool Spirit can call gets a tier.
  - **Tier 0 (read-only)**: query goals/sprints/finance/wellness snapshots —
    auto-allowed, no confirmation.
  - **Tier 1 (reversible, in-app)**: create a sprint, reschedule an action,
    draft a Trading Post listing — Spirit can execute, then shows an
    undo-able "Spirit did this" toast.
  - **Tier 2 (irreversible or external)**: move money, send a message to
    another villager, create/delete a calendar event, post publicly —
    requires an explicit one-tap confirmation card before execution.
- **Audit log**: every Tier 1/2 action Spirit takes gets written to a new
  `spirit_actions` table (`user_id, tool_name, input, result, tier,
  confirmed_at`) — gives the user a visible trail and Spirit a memory of what
  it already did (avoids repeat actions).
- **Gateway Guard (long-horizon)**: when third-party plugins (smart home,
  external bank aggregators, wearable APIs) are added, they sit behind a
  single allow-listed proxy — Spirit never holds raw third-party credentials,
  same as the Calendar pattern.

## Phased build plan

### Phase 1 — Memory Graph (foundation)
Add entity + relationship tables alongside `spirit_memories`:
- `spirit_entities` (`id, user_id, type, label, data jsonb`) — types: goal,
  sprint, action, event, person, place, preference.
- `spirit_relationships` (`from_entity, to_entity, relation, user_id`) — e.g.
  `sprint_3 BLOCKS calendar_event_42`, `goal_fitness RELATES_TO
  wellness_readiness`.
- `fetchSpiritContext()` gains an optional graph traversal so Spirit can
  answer "why" questions ("your 7am sprint conflicts with the gym block you
  set in Spaces").

### Phase 2 — Unified API Fabric (internal-first)
villa9e already aggregates Bank/Wellness/Calendar/Goals/Trading Post — the
"unified fabric" doesn't need to reach outside the app yet. Build a **tool
registry** of villa9e's own internal API routes, exposed to Claude via tool
use:
- `create_sprint_action`, `reschedule_action`, `create_calendar_event`,
  `adjust_goal_timeline`, `post_trading_listing`, `send_tribe_message`,
  `log_wellness_check_in`, `query_finance_snapshot`, etc.
- Each tool = thin wrapper around an existing `/api/...` route + its Tier
  (above). New `lib/claude/spirit-tools.ts` defines the registry; `runSpirit()`
  in `lib/claude/spirit.ts` passes `tools: [...]` to the Claude API and loops
  on `tool_use` blocks.

### Phase 3 — Execution Layer + Trust Wall UI
- Tier 1/2 confirmation card component (reused across Workshop/Bank/Spaces).
- `spirit_actions` audit table + a "Spirit Activity" feed on the Hut.
- Wire the Perceive→Reason→Orchestrate→Execute loop end to end for one
  worked example first (below) before generalizing.

### Phase 4 — Proactive Perception
- Vercel cron job (`/api/spirit/tick`) runs per-user on a schedule, calling
  `fetchSpiritContext()` + memory graph, looking for actionable deltas (GPS
  sprint slipping behind, wellness readiness dropping, calendar conflict with
  a sprint deadline). Tier-1 actions auto-fire; Tier-2 actions create a
  notification ("Spirit wants to ___ — Approve?").
- Expands Perception beyond chat-triggered into "Spirit notices things."

### Phase 5 — External Plugins (long-horizon, not scheduled)
Smart-home/wearable/3rd-party API integration behind the Gateway Guard proxy.
No build until Wellness wearable sync (already in TASKS.md) lands first.

## Worked example, translated to villa9e

Blueprint example was "flight delayed → dinner rebooked + rideshare called."
villa9e equivalent:

> **Perceive**: nightly cron sees Sprint 3 of "Launch my Etsy shop" is 60%
> behind schedule (GPS progress vs. calendar days elapsed), and Spaces shows
> a free 2-hour block tomorrow afternoon.
> **Reason**: Spirit determines the blocked action ("source 10 product
> photos") fits in that free block and is the critical path item.
> **Orchestrate**: checks Wellness readiness for tomorrow (Tier 0, read-only)
> — readiness is high, good day for focused work.
> **Execute**: Tier 1 — creates a calendar event "Sprint 3: Product Photos"
> in that block (`create_calendar_event`), reorders the Workshop feed so
> tomorrow's top card is photography-tutorial content tagged to that action
> (already possible via the `actionContext` banner shipped this session).
> Tier 2 — if it also wanted to message a Trading Post partner to help shoot
> photos, that requires the confirmation card.

## Relationship to existing Spirit work

This spec is the *infrastructure* layer underneath `spirit_phase_c` (Spirit's
personality, 77 Commandments, RAG memory) and the SPIRIT CONNECTIVITY section
of `TASKS.md`. Personality/voice/tone are unchanged — this spec is purely
about giving the same Spirit hands (tools) and a sharper memory (graph).
