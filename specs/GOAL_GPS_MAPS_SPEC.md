# VILLA9E — GOAL GPS (MAPS UI) COMPLETE BUILD SPECIFICATION

> **Status:** Vision / approved prototype. The heart of the Workshop section.
> Logged 2026-06-10. This is the target design for the GPS tab of the goal page —
> a Google Maps–style night-mode map where the goal is the destination, sprints
> are waypoints, actions are turns, and verifying an action mines $VLG on-chain.

Everything needed to build the Goal GPS page so it looks and behaves exactly like
the approved prototype.

**Stack note:** The reference spec is written for React Native (Expo) with
react-native-svg, react-native-gesture-handler, react-native-reanimated, and
react-native-tts. villa9e today is **Next.js web** — when building this on web,
translate: SVG via native `<svg>`, gestures via pointer events / framer-motion
drag, animations via framer-motion + Web Animations, TTS via the existing
`SpiritVoiceProvider` (ElevenLabs + browser fallback). All colors and timings
below are exact — do not approximate.

---

## 0. The metaphor — Goal GPS: The Translation

Every element of a modern GPS has a direct goal equivalent. People already know
how to read this interface:

| Google Maps | Goal GPS | Why it works |
|---|---|---|
| Destination pin | The Goal (flag at top of route) | "Where am I going" is instantly clear |
| Blue you-are-here dot | Current action, pulsing | Always know exactly where you stand |
| Route line | The roadmap — solid behind you, dashed ahead | Progress is visible at a glance |
| Turn-by-turn banner ("In 200 ft, turn left") | Next-action banner ("Day 2: Record module 1") | One instruction at a time — never overwhelming |
| ETA ("Arrives 3:42 PM") | Time to destination ("~Sep 12 · 14 wks left") | Deadline feels real, updates live |
| Traffic colors (green/yellow/red) | Probability score colors the route | Green route = 91% probability; gaps turn segments amber |
| Waypoints / stops | Sprints (tappable circles on the route) | Milestones break the journey into chunks |
| Each turn | Actions inside a sprint | Granular, sequential, verifiable |
| Gas stations on route | "Things needed" — resources, budget, tools | Supplies for the journey, shown along the way |
| Rerouting ("Recalculating…") | Recalibration after a life event | The plan adapts, never dies |
| Lane guidance detail | Wayfinder / Pathfinder / Trailblazer | How detailed the instructions are |
| "You have arrived" | Goal complete celebration + on-chain credential | The payoff moment |
| _(Maps has no equivalent)_ | **Verify → mine $VLG** | Every verified "turn" writes a Growth Receipt on-chain and earns $VLG |

The one thing Maps doesn't have is the **mining layer** — villa9e's signature
move: every verified action is a block written to the chain. The verify flow
should feel like mining: proof in → Spirit checks → block confirmed → tokens out.

Four ideas the prototype hints at for the real build:
- **Probability as traffic.** When a gap opens (budget shortfall, skill missing),
  the affected route segment turns amber — exactly how Maps shows congestion.
  Tapping the amber segment opens Spirit's pathTo95 guidance for that gap.
- **Things needed as map buildings.** Resources sit on the map near the sprint
  where they're needed — the USB mic "building" sits beside Sprint 3 because
  that's when recording starts. Tapping one opens the Spirit Recommends affiliate
  card. The map itself becomes a revenue surface.
- **Mining as the arrival ritual.** Every waypoint pass mints currency and writes
  an immutable record; at goal completion the full chain of Growth Receipts
  compiles into the on-chain Achievement Credential.
- **Zoom levels.** Zoomed out = full route with all sprints. Pinch into a sprint =
  it expands into its individual actions as turn markers. Pinch into an action
  (Wayfinder) = Spirit's step-by-step instructions. Highway view → street view.

---

## 1. Page identity

- Route: `/village/workshop/gps` (the GPS tab of the Workshop section). For a
  specific goal: `/village/workshop/gps/{goalId}`. With no goalId, load the
  user's primary active goal.
- Lives INSIDE the Workshop section. One of three top-level tabs.
- The global teepee radial nav button floats above everything (56px circle,
  `#0033CC`, centered, 16px from bottom). All page content must clear 72px from
  the bottom edge. The bottom sheet's collapsed position accounts for this.
- The page is always dark. There is no light mode for the map screen — like
  Google Maps night mode, the dark canvas IS the design.

---

## 2. Top tab bar — Goals | Workshop | GPS

**Position:** absolute top, full width, respects safe-area inset. Height 44px.
Background `#0a1220` (blends into the map page — not a separate surface).

| Tab | Route | State on this page |
|---|---|---|
| Goals | `/village/workshop/goals` | inactive |
| Workshop | `/village/workshop` (TikTok feed) | inactive |
| GPS | `/village/workshop/gps` | ACTIVE — underlined |

**Tab styling:**
- Font 13px, weight 500.
- Inactive: `rgba(255,255,255,0.45)`, no underline.
- Active (GPS): `#FFFFFF`, 2px solid `#FFFFFF` underline (width = label width),
  6px below baseline.
- Tap target 44px tall, label width + 20px horizontal padding.
- Switch: crossfade content 180ms; underline slides to the new tab over 200ms
  ease-out (shared element, like TikTok).
- **Right side:** search icon `ti-search`, 19px `#FFFFFF`, 12px from right edge —
  opens goal search overlay.

---

## 3. Layout architecture (z-stack, bottom → top)

```
z0  Map canvas (SVG) — full bleed, behind everything
z1  Destination flag + label (part of map SVG)
z2  Route paths + waypoints + you-are-here marker (part of map SVG)
z3  Turn-by-turn banner (absolute, below tab bar)
z4  Floating action buttons (recenter, reroute) — right edge
z5  Recalculating toast (center bottom of map zone)
z6  Bottom sheet (absolute bottom, drag-expandable)
z7  Teepee nav button (global, always on top)
```

The map canvas extends UNDER the tab bar and UNDER the sheet — the sheet floats
over the map like Google Maps. Expanding the sheet covers more map; the map never
resizes.

---

## 4. Map canvas

### 4.1 Base
- Background `#0d1626` (map surface). Chrome behind it `#0a1220`.
- A single `<Svg>` inside a pan-enabled container (gestures: Section 10).
- ViewBox is a world-coordinate system. Design reference 280 × 330 units per
  screen of route; real impl uses a camera transform (translate + scale) over a
  larger world for pan/zoom.

### 4.2 Streets (decorative grid)
Faint road strokes, color `#16223a`, 3–8° tilt (never axis-aligned):
- 3 horizontal streets: stroke-width 10–12, gentle slopes.
- 2 vertical streets: stroke-width 9, gentle slopes.
- Beneath buildings and route. No labels.

### 4.3 Resource buildings (the "gas stations")
Rounded rects for things-needed resources, placed near the sprint that needs them:
- Fill `#13203a`, corner radius 3, ~40–52 wide × 26–34 tall.
- Label 7px (scale with zoom; min ~9–10px device px), fill `#3a5070`, e.g.
  "Skill: editing", "Funding $840", "Tribe: 2 helpers", "USB mic $89".
- TAPPABLE → Spirit Recommends affiliate popover anchored to the building
  (product image, name, price in `#FAC775`, "View in Trading Post"). Revenue surface.
- Data-driven from `goal.resources[]`, each with a map position near its sprint.

### 4.4 Route rendering
A single conceptual polyline through all sprint waypoints, rendered as up to four
layered segments:
1. **Completed route** — start → last verified action. Solid `#1D9E75`, width 5,
   round caps. Smooth cubic Béziers between waypoints (never straight — the road winds).
2. **Active segment (fill target)** — you-are-here → next action. Same style but
   `stroke-dasharray = pathLength`, `stroke-dashoffset = pathLength` (invisible),
   animated to 0 on verify (9.4).
3. **Route ahead** — current → goal. Dashed `#5DCAA5`, width 4, `dasharray "7 7"`,
   opacity 0.85.
4. **Gap segments (traffic)** — any segment whose sprint has an unresolved gap
   renders its dashed portion amber `#EF9F27`. TAPPABLE → Spirit pathTo95 for that
   gap in the bottom sheet.

Geometry: Catmull-Rom → Bézier through the waypoints with alternating control-point
bias so the road serpentines (1–2 bends per leg).

### 4.5 Sprint waypoints
One circle per sprint, three states:

| State | Radius | Fill | Stroke | Label color |
|---|---|---|---|---|
| Done | 11 | `#0F6E56` | `#9FE1CB` 1.5px | `#E1F5EE` |
| Active | 13 | `#534AB7` | `#CECBF6` 2px | `#EEEDFE` |
| Pending | 11 | `#1e2a3e` | `#3a5070` 1.5px | `#7a92b0` |

- Label "S1"…"Sn", 9px weight 500, centered. Tap target 44×44.
- TAP: repoints the sheet's sprint inspector to that sprint (8.4) + circle pops
  1 → 1.15 → 1 over 200ms. Camera only moves if the waypoint is off-screen (eases
  it on-screen over 350ms). Taps never change the ACTIVE waypoint — only what's inspected.

### 4.6 You-are-here marker
At the current action's coordinate (interpolated along the route between the active
sprint's waypoint and the next, proportional to actions completed within the sprint):
- **Pulse ring:** circle fill `#534AB7`, radius 12 → 22 → 12 over 2000ms loop,
  opacity 0.35 → 0.05 → 0.35 (Reanimated / WAAPI, not SMIL).
- **Heading arrow:** path `M0,-9 L6,7 L0,3 L-6,7 Z`, fill `#AFA9EC`, stroke
  `#EEEDFE` 1px, rotated along the route tangent at the current position.
- Advance animation: Section 9.4.

### 4.7 Destination flag
At the goal coordinate (top-right of default camera):
- Pole + pennant `M0,0 L0,-22 L14,-17 L0,-12`, fill `#EF9F27`, stroke `#FAC775`
  1px; base dot r=3 fill `#FAC775`.
- Goal label 8px (~10px device) fill `#FAC775`, right of pole, truncate 24 chars.
- On completion: flag waves (3 skew oscillations) + "You have arrived" celebration
  (links to existing Sprint/Goal completion + Achievement Credential mint).

---

## 5. Turn-by-turn banner (the most important element)

- **Position:** absolute, top = tab-bar height + 10px, left/right 10px.
- **Container:** bg `#0F6E56`, radius 10px, padding 8px 10px, flex row, align
  center, gap 8px. NO shadow, NO gradient.
- **Left icon:** `ti-arrow-up-right` 20px `#E1F5EE`. Reflects next maneuver:
  `ti-arrow-up-right` normal, `ti-flag` when next action completes a sprint,
  `ti-rocket` when it completes the goal.
- **Text block (flex 1, min-width 0):**
  - Line 1 (context) 10px `#9FE1CB`: `Sprint {n} · action {i} of {total} · day {d}`.
  - Line 2 (instruction) 12px weight 500 `#E1F5EE`, line-height 1.3, max 2 lines:
    current action title, sentence case, em-dash separating title/subtitle.
- **Right icon:** `ti-volume` 16px `#9FE1CB`. Tap = Spirit Voice reads line 2.
  Long-press = toggle voice off (`ti-volume-off`, persisted).
- **Update:** on action change, line text crossfades 250ms; left icon pops 0.8 → 1.

---

## 6. Floating action buttons

Stacked vertically, right edge of MAP zone: right 10px, bottom = sheet collapsed
height + 12px. Each: 38px circle, bg `#13203a`, border 0.5px `#2a3a55`, icon 18px
`#85B7EB`, pressed scale 0.94.

1. **Recenter** `ti-current-location` — eases camera back to frame you-are-here at
   40% from bottom, 400ms ease-out. Marker blinks (1 → 0.3 → 1, 300ms) to confirm.
2. **Reroute (recalibrate)** `ti-route`:
   - Toast "Recalculating…".
   - `POST /api/gps/recalibrate` (re-runs relevant Wave agents server-side).
   - At T+1200ms minimum (even if API is faster — the pause makes it feel real),
     toast → `Route updated · probability {old}% → {new}%`.
   - Probability chip updates with a 150ms scale pop.
   - Resolved/appeared gaps: segments crossfade teal-dash ↔ amber-dash over 400ms.
   - Toast auto-hides at T+3200ms.

---

## 7. Recalculating toast

- Position: centered, bottom = sheet collapsed height + 14px.
- Container: bg `#13203a`, border 0.5px `#2a3a55`, radius 20px pill, padding 6px 14px.
- Text 11px `#B5D4F4`, single line.
- Enter: fade + 6px slide-up 180ms. Exit: fade 180ms.
- Reused for recenter confirmations and transient map messages.

---

## 8. Bottom sheet (Google Maps directions sheet)

### 8.1 Container + snap points
- Bg `#0e1828`, border-top 0.5px `#1e2a3e`, radius 18px 18px 0 0.
- Drag handle 34×4px `#2a3a55`, centered, 8px from top. Vertical drag on handle/
  header moves between snap points (spring: damping 18, stiffness 180).
- **Snap points:** `peek` 96px (handle + ETA row; used while panning the map);
  `default` ~300px (everything in 8.2–8.6, initial); `expanded` 75% screen (adds
  full sprint roadmap list).
- Keep bottom content 72px clear of screen bottom (teepee clearance) → 72px bottom
  padding inside the sheet.

### 8.2 ETA row
Flex row, baseline aligned, gap 8px, margin-bottom 6px:
- **Time to destination** 18px weight 500 `#E1F5EE` — `{n} wks` (or `{n} days` < 2 wks).
- **Arrival** 11px `#7a92b0` — `arrives ~{Mon D}` from remaining actions ×
  estimated days, recomputed after each verify/recalibrate. Append ` · {n} actions left`.
- **Probability chip** (right, margin-left auto) 11px weight 500, `#9FE1CB` on
  `#04342C`, radius 12, padding 2px 8px, `{p}% probability`. Color by score:
  ≥85 teal; 70–84 amber (`#FAC775` on `#412402`); <70 red (`#F09595` on `#501313`).
  Always matches the route-ahead dash color (it's the "traffic status").

### 8.3 Mining chips row
Flex row, gap 6px, margin-bottom 8px:
- **$VLG mined chip:** `ti-pick` 10px + `{balance} $VLG mined`, 10px `#FAC775` on
  `#412402`, radius 12, padding 2px 8px. Balance = lifetime $VLG from THIS goal.
  Counts up +25 (300ms) on verify.
- **Completion chip:** `{pct}% complete`, 10px `#AFA9EC` on `#26215C`. pct =
  verified actions / total actions.

### 8.4 Sprint inspector
- Header 10px `#7a92b0`, letter-spacing 0.4px, uppercase:
  `SPRINT {n} — {TITLE} · {x} OF {y} DONE` (or `· DONE` / `· UPCOMING`).
- Defaults to ACTIVE sprint; map waypoint taps repoint it (4.5).
- Action rows (3px vertical padding, flex row, gap 7px):
  - Status icon 14px: done `ti-circle-check` `#5DCAA5`; active `ti-navigation`
    `#AFA9EC`; pending `ti-circle` `#3a5070`.
  - Title 11px: active `#EEEDFE` weight 500; done `#7a92b0`; pending `#B5D4F4`.
  - Row tap (active/pending): expands inline to show verification method
    ("Verify: video upload") and, for Wayfinder users, a "Full instructions" link
    opening the Wayfinder instruction sheet.

### 8.5 Things needed row
- Header `THINGS NEEDED ON THIS ROUTE` (same label style as 8.4).
- Horizontal wrap of chips: 10px `#B5D4F4` on `#13203a`, border 0.5px `#2a3a55`,
  radius 12, padding 3px 8px. From `goal.resources[]`: name + cost
  ("USB mic $89", "Editing skill", "8 hr/wk", "$840 budget").
- Chip tap: camera eases to that resource's building + opens its affiliate popover.
  Resolved resources render with leading `ti-check` 10px and 0.55 opacity.

### 8.6 Verify button
- Full width, bg `#534AB7`, radius 10px, padding 10px, text 13px weight 500
  `#EEEDFE`, centered: `ti-pick` 16px + `Verify action · mine $VLG`.
- Disabled (no verifiable action / mid-sequence): opacity 0.4.
- Tap → existing verification proof flow (photo/video/screenshot/document/social
  URL/text). On submission, the mining sequence (Section 9) renders inside the
  sheet below the button.
- Success terminal: bg → `#0F6E56`, content `ti-circle-check` + `Verified · +25
  $VLG mined`, holds 2.5s, resets pointing at the NEXT action.

---

## 9. The verify → mine sequence (signature interaction)

State machine: `idle → proofSubmitted → spiritVerifying → receiptWritten →
vlgMinted → advancing → idle(next)`.
Failure branch: `spiritVerifying → rejected` — Spirit's follow-up renders in place
of steps 3–4 ("I want to make sure this was completed properly — tell me more about
what you did") with a reply field; resubmission returns to `spiritVerifying`.

### 9.1 Mining steps list
Below the verify button, 4 rows. All mount at opacity 0.25; each "lights"
(opacity → 1, 200ms) on schedule, with a `ti-check` 13px `#5DCAA5` fading in at its
right edge on completion.

| T (ms) | Row | Icon | Text (11px `#B5D4F4`) | Check at |
|---|---|---|---|---|
| 0 | 1 | `ti-upload` `#85B7EB` | Proof submitted — {method} | +450 |
| 1100 | 2 | `ti-sparkles` `#AFA9EC` | Spirit verifying proof… | +900 |
| 2200 | 3 | `ti-cube` `#FAC775` | Growth Receipt #{shortHash} written on-chain | +450 |
| 3300 | 4 | `ti-coins` `#EF9F27` | +25 $VLG mined · Phase {n} rate (`#FAC775` weight 500) | +450 |

Row 3's hash is the REAL short tx hash from `POST /api/actions/{id}/verify`
(e.g. `#0x4f2a`), tappable → block explorer for the Growth Receipt.

**Server timing:** fire the API at T=0. Steps 1–2 are presentation; step 3's check
must not show until the server confirms the on-chain write. If the server is slower,
step 2 holds with an animated ellipsis until confirmation, then 3–4 resume cadence.

### 9.2 Blockchain visual
SVG strip (full sheet width, 44px tall) below the steps — linked blocks:
- Existing blocks: 34×22 rect radius 4, fill `#13203a`, stroke `#2a3a55` 1px; hash
  8px `#7a92b0` monospace (the user's two most recent receipts). 20px links, stroke
  `#2a3a55` width 2. Right caption `Village chain` 9px `#7a92b0`.
- **New block (T=2400ms):** starts opacity 0, −14px up; → opacity 1, translate 0
  over 600ms ease. Fill `#412402`, stroke `#EF9F27` 1.5px, hash `#FAC775`. Then the
  connecting link draws left→right: `#EF9F27` 2px, 0 → 20px over ~300ms. Light
  haptic on landing.

### 9.3 Wallet update (T=3300ms with row 4)
$VLG chip (8.3) counts up +25 over 300ms with a 1 → 1.12 → 1 pop. Server is source
of truth — animate to the balance returned by verify, never compute client-side.

### 9.4 Route advance (T=4600ms) — three simultaneous 1200ms-ease animations
1. **Active segment fills:** invisible segment (4.4 item 2) animates
   `stroke-dashoffset → 0`, painting solid teal.
2. **You-are-here advances:** marker transform animates along the path
   (`getPointAtLength` sampling at 60fps) to the new action coordinate; heading
   arrow rotates to the new tangent.
3. **Banner updates:** crossfade to the next action (Section 5).

Then: sprint inspector re-renders (prev action → done; next → active); verify button
enters success terminal (8.6); after 2.5s the sequence area collapses (height 300ms)
back to `default`.

**Sprint completion:** if the verified action was the sprint's last, advance lands
ON the next waypoint; the completed waypoint morphs purple → teal (fill crossfade
400ms) with a 1 → 1.3 → 1 pop; the existing Sprint Completion Celebration fires
after the route animation.

---

## 10. Gesture system (exact disambiguation)

### 10.1 Left-edge swipe → back to Workshop (anywhere)
- Recognizer: horizontal pan with `touchstart.x ≤ 24dp` from the LEFT edge.
- Commit: `dx ≥ 60dp` rightward AND `|dy| ≤ 50dp` AND velocity ≥ 0.3 dp/ms.
- PRIORITY over map pan and sheet gestures (edge recognizer wins via `waitFor`).
- Action: navigate to `/village/workshop` with an iOS-style interactive slide
  (page tracks the finger; Workshop beneath at 0.92 scale + dim; commit completes
  in 250ms; cancel springs back 200ms).

### 10.2 Map zone: pan vs distinct swipe
- **Pan (default):** any drag in the map zone (below banner, above sheet, not on a
  FAB/waypoint) translates the camera 1:1. Pinch = zoom (Section 11). Momentum on
  release (decay friction 0.995). Panning never navigates if it fails the swipe test.
- **Distinct swipe → Workshop:** qualifies ONLY if ALL of: rightward `dx ≥ 120dp`,
  `|dy| ≤ 40dp`, duration ≤ 250ms, release velocity ≥ 0.8 dp/ms. Evaluated at
  RELEASE — during the drag the camera pans; a qualifying release cancels pan
  momentum and runs the slide-to-Workshop. Slow/diagonal/long drags stay on the
  map. Leftward fast flicks do NOT navigate (reserved; pan only).

### 10.3 Bottom sheet horizontal swipe → Workshop
- Horizontal pan starting in the sheet (ETA/chips/inspector/things-needed, NOT the
  verify button or during mining): commit rightward `dx ≥ 80dp`, `|dy| ≤ 40dp`,
  velocity ≥ 0.5 dp/ms → slide-to-Workshop.
- Sheet vertical drag vs this horizontal swipe disambiguate by initial direction
  lock: whichever axis exceeds 12dp first owns the gesture.
- During an active mining sequence, horizontal nav from the sheet is DISABLED. Edge
  swipe (10.1) remains; if used mid-sequence, it completes server-side and shows the
  result toast on return.

### 10.4 Other
- Single tap on map: deselect inspected waypoint → inspector returns to active
  sprint; closes any building popover.
- Double tap: zoom in one level centered on tap (300ms ease).
- Waypoint/building/amber-segment taps per 4.3–4.5. Tap targets ≥ 44dp.

---

## 11. Zoom levels

| Level | Scale | Shows |
|---|---|---|
| Goal view (default) | 1.0 | Full route, all waypoints, buildings, flag |
| Sprint view | ≥ 1.8 | Legs expand: actions render as 8px turn markers (waypoint state colors) along the leg; titles label at 9px |
| Action view (Wayfinder) | ≥ 3.0 | Centering an action opens its Wayfinder instruction sheet (Spirit's step-by-step) |

- Continuous pinch; thresholds crossfade layers 200ms (action markers fade in
  1.6→1.8; building labels hide above 2.2). Limits 0.7–4.0. Recenter FAB resets to
  1.0 framing you-are-here.

---

## 12. Data model (TypeScript)

```ts
interface GpsGoal {
  id: string;
  title: string;                       // flag label
  probabilityScore: number;            // 0–100, drives chip + route color
  etaWeeks: number;
  etaDate: string;                     // ISO, server-computed
  actionsRemaining: number;
  percentComplete: number;
  vlgMinedTotal: number;               // lifetime $VLG for this goal
  vlgPhase: 1 | 2 | 3 | 4;             // halving phase, shown in mining row 4
  actionLevel: 1 | 2 | 3;              // Wayfinder | Pathfinder | Trailblazer
  sprints: GpsSprint[];
  resources: GpsResource[];
  route: GpsRoute;
}

interface GpsSprint {
  id: string;
  number: number;                      // S{number}
  title: string;
  status: 'done' | 'active' | 'pending';
  actions: GpsAction[];
  gap?: { severity: 'major'|'critical'; description: string; pathTo95: string[] };
  waypoint: { x: number; y: number };  // world coords
}

interface GpsAction {
  id: string;
  title: string;                       // banner line 2
  subtitle?: string;
  status: 'done' | 'active' | 'pending';
  dayIndex: number;                    // "day 2"
  estimatedDays: number;
  verificationMethod: 'photo'|'video'|'screenshot'|'document'|'social_url'|'text';
  routeT: number;                      // 0–1 position along the sprint leg
}

interface GpsResource {
  id: string;
  label: string;                       // chip + building text
  cost?: number;
  acquired: boolean;
  affiliateProductId?: string;         // building popover
  building: { x: number; y: number; w: number; h: number };
  nearSprintId: string;
}

interface GpsRoute {
  waypointPath: string;                // server-generated full SVG path d
  legs: { sprintId: string; d: string; length: number }[];
}

interface VerifyResponse {
  ok: boolean;
  receiptHash: string;                 // mining row 3 + explorer link
  vlgAwarded: number;                  // 25 at Phase 1
  vlgNewBalance: number;
  nextAction: GpsAction | null;
  sprintCompleted: boolean;
  goalCompleted: boolean;
  newProbability: number;
  newEtaDate: string;
  newEtaWeeks: number;
}
```

Route geometry is generated SERVER-SIDE on GPS activation/recalibration (consistent
across devices); the client only animates along provided paths.

---

## 13. API endpoints

```
GET  /api/gps/{goalId}                 → GpsGoal (full payload incl. route geometry)
POST /api/actions/{actionId}/verify    → VerifyResponse  (multipart proof upload)
POST /api/gps/{goalId}/recalibrate     → { probability, route?, gaps[], etaDate, etaWeeks }
GET  /api/gps/{goalId}/receipts        → recent Growth Receipts (chain strip blocks)
GET  /api/resources/{id}/recommend     → affiliate popover payload
```

---

## 14. Color token table (single source of truth)

| Token | Hex | Used for |
|---|---|---|
| `gps.page` | `#0a1220` | page + tab bar bg |
| `gps.map` | `#0d1626` | map surface |
| `gps.street` | `#16223a` | street strokes |
| `gps.building` | `#13203a` | buildings, FABs, toast, chips bg, old blocks |
| `gps.buildingLabel` | `#3a5070` | building text, pending action icon |
| `gps.borderDim` | `#2a3a55` | FAB/toast/chip borders, handle, block strokes/links |
| `gps.routeDone` | `#1D9E75` | solid route |
| `gps.routeAhead` | `#5DCAA5` | dashed route |
| `gps.gap` | `#EF9F27` | amber segments, flag, coins icon, new-block stroke |
| `gps.wpDone` | `#0F6E56` | done waypoints, banner bg, verified button |
| `gps.wpDoneStroke` | `#9FE1CB` | done waypoint stroke, banner sub, prob-chip text |
| `gps.active` | `#534AB7` | active waypoint, pulse ring, verify button |
| `gps.activeStroke` | `#CECBF6` | active waypoint stroke |
| `gps.arrow` | `#AFA9EC` | heading arrow, sparkles, complete-chip text, active-action icon |
| `gps.textHi` | `#E1F5EE` | ETA, banner title, waypoint labels |
| `gps.textBody` | `#B5D4F4` | toast, chips, mining text, pending titles |
| `gps.textMute` | `#7a92b0` | sub-labels, section headers, done titles, hashes |
| `gps.amberText` | `#FAC775` | VLG chip, flag label, new-block hash, mined line |
| `gps.amberBg` | `#412402` | VLG chip bg, new block fill |
| `gps.probBg` | `#04342C` | probability chip bg (≥85) |
| `gps.completeBg` | `#26215C` | completion chip bg |
| `gps.fabIcon` | `#85B7EB` | FAB icons, upload icon |
| `gps.check` | `#5DCAA5` | step checks, done icons (same as routeAhead) |

---

## 15. Component tree

```
<GpsScreen>
  <WorkshopTabBar active="gps" />            // Goals | Workshop | GPS̲ + search
  <GestureRoot>                              // 10.1 edge recognizer wraps all
    <MapViewport>                            // pan/pinch camera (10.2, 11)
      <MapSvg>
        <Streets/> <Buildings onTap/>
        <RouteAhead/> <GapSegments onTap/>
        <RouteDone/> <ActiveSegment ref/>    // fill target
        <Waypoints onTap/> <DestinationFlag/>
        <YouMarker ref/>                     // pulse + advance
      </MapSvg>
      <TurnBanner/>                          // z3
      <FabColumn> <Recenter/> <Reroute/> </FabColumn>
      <MapToast/>
    </MapViewport>
    <BottomSheet snapPoints={[peek, default, expanded]}>
      <Handle/> <EtaRow/> <MiningChips/>
      <SprintInspector/> <ThingsNeeded/>
      <VerifyButton/> <MiningSequence/>      // 9.1–9.2, conditional
      <SprintRoadmapFull/>                   // expanded snap only
    </BottomSheet>
  </GestureRoot>
  <TeepeeNav/>                               // global, z7
</GpsScreen>
```

---

## 16. Accessibility + edge cases

- Every interactive map element: `accessibilityLabel` ("Sprint 3, build MVP,
  active, 3 of 5 actions done"). Banner is a live region announcing action changes.
  Mining steps announce on completion.
- Reduce-motion: replace pulse/advance/fill with instant state + 150ms fades;
  mining steps still sequence (they convey order) but without the block drop.
- Offline verify: queue the proof, button shows `ti-cloud-upload` + "Will verify
  when online"; mining sequence runs on sync.
- No active goal: map shows a single dashed "?" route to a ghost flag; banner
  "No destination set — talk to Spirit"; verify button → "Create my GPS with
  Spirit" → `/village/workshop/chat`.
- Goal complete: route fully solid, flag celebration, sheet shows Achievement
  Credential card + "Set your next destination".
- All displayed numbers are server values or pass-through rounding — never raw
  float math on screen.

---

## 17. Amendments (2026-06-12) — marker, scrubbing, ordering, proof verification

These amendments are implemented in `app/village/workshop/gps/[id]/page.tsx`.

### 17.1 "You are here" marker = profile picture, not an arrow

The marker is always the user's avatar (with a hand-drawn default silhouette if
no `avatar_url`) — never an arrow shape, on the map and in any future GPS-style
view. Clicking the user's avatar on `/village/hut` opens a file picker and
uploads a new profile picture via `POST /api/profile/avatar` (existing route);
the new `avatar_url` updates the marker everywhere immediately.

### 17.2 Drag-to-scrub the timeline

The avatar marker can be dragged up/down along the route (pointer events) to
scrub through completed and upcoming sprints. Dragging snaps to the nearest
point on the route path (`nearestLenOnPath`) and updates `inspectIdx` via
`sprintIdxForLen` + `legBounds` — this is **view-only**: it changes which
sprint's actions the bottom sheet shows, not the user's actual progress
(`youPoint`/`progress` are unaffected). A "Back to current" control returns
`inspectIdx` to `activeSprintIdx`.

### 17.3 Sequential actions, with a parallel-action exception

Actions within the active sprint must be completed in order **unless** Spirit
(the GPS sprint generator, `lib/claude/gps.ts`) flagged a later action
`canRunInParallel: true` with `dependsOn` referencing only already-complete
actions. These flags persist as `sprint_actions.can_run_parallel` /
`depends_on_action_ids` (migration `049_gps_action_ordering.sql`; temp ids like
`"s1a2"` are resolved to real UUIDs in `app/api/gps/activate/route.ts`). The
set of currently-workable actions is `availableActionIds`. The user picks among
them via the action detail drawer's "⇄ Work on this now" button, which sets
`selectedActionId` (distinct from `currentAction`, the strict next-in-order
action).

### 17.4 Swipe left/right on the actions panel; swipe up / tap for details

Horizontal swipes on the bottom-sheet action list move `inspectIdx` to the
adjacent sprint (past = completed, future = upcoming), independent of the
marker drag in 17.2. A vertical swipe-up, or tapping any action row, opens a
sliding detail drawer with that action's full title/description and a
contextual control (✓ Completed / "This is what I'm working on" / "⇄ Work on
this now" / 🔒 locked). Swiping down on the drawer dismisses it.

### 17.5 Real verification: proof upload → AI check → DreamLine co-sign

"⛏ Verify action · mine $VLG" no longer instantly completes the action. It
opens a proof sheet requiring a photo or video of the completed action (plus
an optional note):

1. `POST /api/actions/[id]/submit-proof` uploads the file to the
   `action-proofs` storage bucket.
2. **Photos** are checked immediately by Claude vision. If confidence ≥ 75,
   the action is marked complete, the sprint-completion cascade runs, and
   $VLG is awarded — the existing mining animation/Village-chain visual plays.
3. **Videos**, and photos Claude can't confidently verify, create a
   `action_verifications` row (`status: 'pending'`, migration
   `050_action_verifications.sql`) and a `dream_line_posts` entry
   (`milestone_type: 'verification_request'`) with the proof attached. The
   action stays incomplete.
4. On the user's DreamLine, the post renders a "Verify this proof" card
   (`VerificationRequestCard` in `app/village/dreamline/page.tsx`) showing the
   media, an X/3 confirm progress bar, and Confirm/Reject buttons for other
   villagers (`POST /api/dreamline/verifications/[id]/vote`). At 3 confirms
   the action completes, the sprint cascade runs, and $VLG is awarded to the
   owner (10) and each voter (1, as thanks). At 3 rejects the request closes
   so the user can resubmit proof.
5. The GPS page shows a "Waiting on 3 friends to verify your proof" banner
   with **View** (link to the DreamLine post) and **Share & invite** (native
   share sheet, falling back to copy-link) — this is the share/invite path
   that also brings new people into the app.

Pseudo-sprints (`goal_steps`-backed, ids prefixed `week-`, used before a goal
has real GPS sprints) keep the older instant-complete verify flow — the proof/
co-sign system applies to `sprint_actions` only.

---

## Build status / relationship to current code

- The current `app/village/workshop/goal/[id]/page.tsx` is the interim
  (pre-Maps-UI) goal page. Its tab set is being aligned to **Goals | Workshop | GPS**
  (Section 2) and a left→right / left-edge swipe back to `/village/workshop`
  (Section 10.1) as the first step toward this spec.
- Server route geometry, the `/api/gps/{goalId}` payload shape, on-chain Growth
  Receipts, and $VLG mining (Sections 9, 12, 13) are future work — the existing
  `/api/gps/*` routes (assess/activate/recalibrate) are the seed.
- This is the canonical target for the GPS surface. Build toward it incrementally.
