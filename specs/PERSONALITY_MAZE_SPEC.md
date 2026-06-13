# PERSONALITY MAZE — SPEC

> Logged 2026-06-12. The maze itself is **built** (`app/village/hut/personality/page.tsx`,
> linked from Hut → Settings → "Personality Maze"). This spec captures the existing
> mechanic and the **new** vision: using the result to pair compatible villagers as
> Trading Post partners.

## The maze (built)

A short, story-framed quiz — "navigate 5 crossroads to find yours," no wrong paths.
5 questions (`MAZE_QUESTIONS`), 4 choices each tagged A/B/C/D. `scoreToArchetype()`
maps the A/B/C/D tally to one of **8 archetypes** (`ARCHETYPE_RESULTS`):

| Archetype | Emoji | Color | Essence |
|---|---|---|---|
| Architect | 🏗️ | `#1877F2` | Builds with intention — systems, structure, long-term plans |
| Spark | ⚡ | `#FF6B2B` | Ignites — energy, creativity, fast action |
| Anchor | ⚓ | `#22C55E` | Holds — reliability, consistency, emotional stability |
| Compass | 🧭 | `#F9A8D4` | Orients — empathy, relationship intelligence |
| Pioneer | 🏔️ | `#8B5CF6` | Goes first — courage, adaptability, risk tolerance |
| Sage | 📚 | `#FFD700` | Knows — pattern recognition, teaching, long view |
| Weaver | 🕸️ | `#14B8A6` | Connects — network thinking, bridge building |
| Flame | 🔥 | `#DC2626` | Burns for it — fierce commitment, resilience |

Result is saved to `profiles.personality_type` (`saveResult()`). Each archetype already
carries a `match` line describing its ideal complementary archetype (e.g. Architect ↔
Spark, Anchor ↔ Pioneer, Compass ↔ Architect, Weaver ↔ Pioneer, Sage ↔ Spark, Flame ↔
Anchor) — this compatibility map is the seed for the Trading Post matching mechanic
below.

Spirit already reads `personality_type` as `archetype` in goal chat, GPS assess/activate,
recalibration, and Spaces prep prompts (`spirit_collective` even has per-archetype
strength insights, e.g. Weavers do 45% better on tribe goals than solo goals).

## NEW — Archetype matching for Trading Post partner tasks

**The maze isn't just flavor — it's a matchmaking layer.** Some Trading Post
deals/tasks require a partner (can't be completed solo). When a user creates or
accepts one of these, Spirit:

1. Reads the user's `personality_type` and the task's required complementary
   archetype(s) (derived from the existing `match` map — e.g. an Architect-heavy
   planning task pairs best with a Spark or Pioneer partner).
2. Surfaces candidate partners from the user's network/discovery pool whose
   `personality_type` is the complementary archetype, ranked alongside existing
   Trading Post relevance signals (category, deal history, $VICO tier).
3. Presents the match with a short Spirit-written rationale (why this pairing
   works — pulled from each archetype's `desc`/`strengths`/`match` text).

**Where this surfaces:**
- Trading Post task/deal cards that require a partner show a "Find your match"
  CTA → Spirit-recommended partner list.
- Hut/profile shows the user's archetype badge (emoji + name) so it's visible
  to potential partners browsing a profile.
- If a user hasn't taken the maze yet, partner-required tasks prompt them to
  do so first ("Discover your archetype to find your best-fit partner").

## Open items (not yet built)
- [ ] Archetype badge on Hut/profile header
- [ ] "Partner required" flag on Trading Post deals/tasks
- [ ] Matching query: candidates by complementary `personality_type` + network proximity
- [ ] Spirit-written match rationale (short, per-pairing)
- [ ] "Find your match" CTA + results sheet on partner-required tasks

See [[project-villa9e-vision-log]], `VISION_LOG.md`, `PLATFORM_SPEC.md` (Spirit
connectivity).
