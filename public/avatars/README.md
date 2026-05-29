# Avatar GLB Files

## How to add 3D avatars

### Step 1 — Download free CC0 characters:

**Option A: Quaternius Universal Base Characters** (Recommended — perfect cartoon village style)
- Go to: https://quaternius.com/packs/ultimatecharacters.html
- Download the pack (free, no account needed)
- Place the character GLB files here as:
  - `public/avatars/character_male.glb`
  - `public/avatars/character_female.glb`

**Option B: Kenney.nl Modular Characters**
- Go to: https://kenney.nl/assets/modular-characters
- Download (free, no account needed)
- Place files here as `character_base.glb`

### Step 2 — The code will auto-load them

The `VillagePlayerCharacter` component checks for these files and uses them
when available. It falls back to the built-in SVG billboard avatar if not found.

### Animations (optional)
If your GLB includes animations, name them:
- `Idle` — default standing pose
- `Walk` or `Run` — movement animation

Mixamo animations (free download from mixamo.com) can be applied to most characters.
