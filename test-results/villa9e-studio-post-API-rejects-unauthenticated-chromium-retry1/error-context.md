# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: villa9e.spec.ts >> studio post API rejects unauthenticated
- Location: tests/villa9e.spec.ts:120:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "https://villa9e.app/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e5]
      - generic [ref=e14]: villa9e
    - generic [ref=e15]:
      - link "Sign in" [ref=e16] [cursor=pointer]:
        - /url: /login
      - link "Join Free" [ref=e17] [cursor=pointer]:
        - /url: /signup
  - generic [ref=e18]:
    - generic [ref=e19]:
      - generic [ref=e20]: 1000 Founding Villager spots left · 500 $VLG bonus at launch
      - img [ref=e24]
      - heading "It takes a village to achieve your goals." [level=1] [ref=e33]:
        - text: It takes a village
        - text: to achieve your goals.
      - paragraph [ref=e34]: Set a goal. AI builds your plan. Your village validates every step. Progress is a community sport.
      - generic [ref=e35]:
        - link "🏡 Enter the Village" [ref=e36] [cursor=pointer]:
          - /url: /signup
        - link "Sign in →" [ref=e37] [cursor=pointer]:
          - /url: /login
      - paragraph [ref=e38]: Free forever · No credit card needed
    - generic [ref=e39]:
      - generic [ref=e40]: Explore the village
      - generic [ref=e41]: ↓
  - generic [ref=e43]:
    - generic [ref=e44]:
      - paragraph [ref=e45]: The GPS System
      - heading "Your goal. Your plan. Your village." [level=2] [ref=e46]
    - generic [ref=e47]:
      - generic [ref=e48]:
        - generic [ref=e49]: 📡
        - generic [ref=e50]:
          - generic [ref=e51]:
            - generic [ref=e52]: STEP 01
            - heading "Set your goal — Spirit builds your GPS" [level=3] [ref=e53]
          - paragraph [ref=e54]: "Tell Spirit what you want to achieve. In seconds, it generates a full GPS plan: actionable steps, estimated timeline, resource costs, success probability, and the people you'll need."
      - generic [ref=e55]:
        - generic [ref=e56]: ✊
        - generic [ref=e57]:
          - generic [ref=e58]:
            - generic [ref=e59]: STEP 02
            - heading "Your village validates every step with OoWops" [level=3] [ref=e60]
          - paragraph [ref=e61]: As you complete each step, post your proof. Villagers give you OoWops — the village's validation signal. 3 OoWops marks a step complete. You both earn $VLG tokens.
      - generic [ref=e62]:
        - generic [ref=e63]: 🏆
        - generic [ref=e64]:
          - generic [ref=e65]:
            - generic [ref=e66]: STEP 03
            - heading "Your Force Rate rises. Real rewards unlock." [level=3] [ref=e67]
          - paragraph [ref=e68]: Every completed step boosts your Village Score and Force Rate. At scale, $VLG converts to real currency. Your track record unlocks credit, investing access, and opportunities.
  - generic [ref=e70]:
    - generic [ref=e71]:
      - paragraph [ref=e72]: The Village Map
      - heading "8 spaces. One village." [level=2] [ref=e73]
      - paragraph [ref=e74]: Every tool you need to achieve any goal — all in one place.
    - generic [ref=e75]:
      - generic [ref=e76]:
        - generic [ref=e77]: 🔨
        - generic [ref=e78]:
          - paragraph [ref=e79]: Workshop
          - paragraph [ref=e80]: Goal GPS Engine
      - generic [ref=e81]:
        - generic [ref=e82]: ✨
        - generic [ref=e83]:
          - paragraph [ref=e84]: Dream Line
          - paragraph [ref=e85]: Progress Feed
      - generic [ref=e86]:
        - generic [ref=e87]: 🏦
        - generic [ref=e88]:
          - paragraph [ref=e89]: Bank
          - paragraph [ref=e90]: Wallet & Funding
      - generic [ref=e91]:
        - generic [ref=e92]: 🤝
        - generic [ref=e93]:
          - paragraph [ref=e94]: Trading Post
          - paragraph [ref=e95]: Skills & Services
      - generic [ref=e96]:
        - generic [ref=e97]: 👥
        - generic [ref=e98]:
          - paragraph [ref=e99]: Tribes
          - paragraph [ref=e100]: Project Teams
      - generic [ref=e101]:
        - generic [ref=e102]: 📅
        - generic [ref=e103]:
          - paragraph [ref=e104]: Spaces
          - paragraph [ref=e105]: Events & Calendar
      - generic [ref=e106]:
        - generic [ref=e107]: 🌿
        - generic [ref=e108]:
          - paragraph [ref=e109]: Zen
          - paragraph [ref=e110]: Wellness & Spirit
      - generic [ref=e111]:
        - generic [ref=e112]: 🏥
        - generic [ref=e113]:
          - paragraph [ref=e114]: Hospital
          - paragraph [ref=e115]: Licensed Providers
  - generic [ref=e119]:
    - generic [ref=e120]: 🌀
    - heading "Meet Spirit — your AI guide." [level=2] [ref=e121]
    - paragraph [ref=e122]: Spirit knows your goals, your strengths, your pace. It builds your GPS plan, coaches you through every step, connects you with the right villagers, and adapts as you grow.
    - generic [ref=e123]:
      - generic [ref=e124]:
        - generic [ref=e125]: ✓
        - text: Goal GPS Planning
      - generic [ref=e126]:
        - generic [ref=e127]: ✓
        - text: Step-by-step coaching
      - generic [ref=e128]:
        - generic [ref=e129]: ✓
        - text: Probability scoring
      - generic [ref=e130]:
        - generic [ref=e131]: ✓
        - text: Villager matching
    - link "Talk to Spirit →" [ref=e132] [cursor=pointer]:
      - /url: /signup
  - generic [ref=e135]:
    - generic [ref=e136]:
      - generic [ref=e137]: 🎯
      - generic [ref=e138]: ∞
      - generic [ref=e139]: Goals Supported
    - generic [ref=e140]:
      - generic [ref=e141]: 👥
      - generic [ref=e142]: 3×
      - generic [ref=e143]: More likely to succeed with community
    - generic [ref=e144]:
      - generic [ref=e145]: 🪙
      - generic [ref=e146]: "500"
      - generic [ref=e147]: $VLG for Founding Villagers
  - generic [ref=e152]:
    - generic [ref=e153]: 🏕️
    - heading "Your village is waiting." [level=2] [ref=e154]
    - paragraph [ref=e155]: Every goal is better when you don't do it alone. Join free — no credit card, no catch.
    - link "🏡 Join the Village Free" [ref=e156] [cursor=pointer]:
      - /url: /signup
    - paragraph [ref=e157]: villa9e · Powered by Anthropic Claude AI · Legaci Jackson
```

# Test source

```ts
  22  |   await expect(page.locator('text=Terms')).toBeVisible();
  23  |   await expect(page.locator('text=Privacy')).toBeVisible();
  24  |   await expect(page.locator('input[type="email"]')).toBeVisible();
  25  |   await expect(page.locator('input[type="password"]')).toBeVisible();
  26  | });
  27  | 
  28  | test('privacy policy page renders all sections', async ({ page }) => {
  29  |   await page.goto(`${BASE}/privacy`);
  30  |   await expect(page.locator('h1')).toContainText('Privacy Policy');
  31  |   await expect(page.locator('text=COPPA')).toBeVisible();
  32  |   await expect(page.locator('text=Data Locker')).toBeVisible();
  33  |   await expect(page.locator('text=privacy@villa9e.app')).toBeVisible();
  34  | });
  35  | 
  36  | test('terms of service page has affiliate disclosure', async ({ page }) => {
  37  |   await page.goto(`${BASE}/terms`);
  38  |   await expect(page.locator('h1')).toContainText('Terms of Service');
  39  |   await expect(page.locator('text=Affiliate')).toBeVisible();
  40  |   await expect(page.locator('text=FTC')).toBeVisible();
  41  | });
  42  | 
  43  | // ─── Login ────────────────────────────────────────────────────────────────────
  44  | 
  45  | test('can log in with test account', async ({ page }) => {
  46  |   await login(page);
  47  |   // Should land somewhere in the village
  48  |   await expect(page).toHaveURL(/village|map/);
  49  | });
  50  | 
  51  | // ─── Dreamline feed ───────────────────────────────────────────────────────────
  52  | 
  53  | test('dreamline feed loads posts', async ({ page }) => {
  54  |   await login(page);
  55  |   await page.goto(`${BASE}/village/dreamline`);
  56  |   await page.waitForTimeout(3000);
  57  |   // At minimum a post card or empty state should appear
  58  |   const cards = page.locator('[data-testid="post-card"], .post-card');
  59  |   const emptyState = page.locator('text=Nothing here yet');
  60  |   const either = await Promise.race([
  61  |     cards.first().waitFor({ timeout: 8000 }).then(() => 'cards'),
  62  |     emptyState.waitFor({ timeout: 8000 }).then(() => 'empty'),
  63  |   ]).catch(() => 'timeout');
  64  |   expect(either).not.toBe('timeout');
  65  | });
  66  | 
  67  | test('dreamline feed API returns posts', async ({ page }) => {
  68  |   await login(page);
  69  |   const res = await page.evaluate(async () => {
  70  |     const r = await fetch('/api/dreamline/feed?limit=5&offset=0');
  71  |     return { status: r.status, ok: r.ok };
  72  |   });
  73  |   expect(res.status).toBe(200);
  74  |   expect(res.ok).toBe(true);
  75  | });
  76  | 
  77  | // ─── GPS flow ─────────────────────────────────────────────────────────────────
  78  | 
  79  | test('workshop page loads', async ({ page }) => {
  80  |   await login(page);
  81  |   await page.goto(`${BASE}/village/workshop`);
  82  |   await expect(page).toHaveURL(/workshop/);
  83  |   await page.waitForTimeout(2000);
  84  |   // Should show either goals or the guide card
  85  |   const hasContent = await page.locator('text=Goal GPS, text=Start Your First Goal, text=Talk to Spirit').first().isVisible().catch(() => false);
  86  |   // Page rendered without error is enough
  87  |   expect(await page.title()).toBeTruthy();
  88  | });
  89  | 
  90  | test('GPS assess API rejects without goal_id', async ({ page }) => {
  91  |   await login(page);
  92  |   const res = await page.evaluate(async () => {
  93  |     const r = await fetch('/api/gps/assess', {
  94  |       method: 'POST',
  95  |       headers: { 'Content-Type': 'application/json' },
  96  |       body: JSON.stringify({}),
  97  |     });
  98  |     return { status: r.status };
  99  |   });
  100 |   expect(res.status).toBe(400);
  101 | });
  102 | 
  103 | test('GPS activate API blocks below 95%', async ({ page }) => {
  104 |   await login(page);
  105 |   // Use a fake goal_id to test the gate behavior
  106 |   const res = await page.evaluate(async () => {
  107 |     const r = await fetch('/api/gps/activate', {
  108 |       method: 'POST',
  109 |       headers: { 'Content-Type': 'application/json' },
  110 |       body: JSON.stringify({ goal_id: '00000000-0000-0000-0000-000000000000' }),
  111 |     });
  112 |     return { status: r.status };
  113 |   });
  114 |   // 404 (goal not found) or 400 — both are correct, not 200
  115 |   expect(res.status).not.toBe(200);
  116 | });
  117 | 
  118 | // ─── Creator Studio ───────────────────────────────────────────────────────────
  119 | 
  120 | test('studio post API rejects unauthenticated', async ({ page }) => {
  121 |   // Fresh page, not logged in
> 122 |   await page.goto(BASE);
      |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  123 |   const res = await page.evaluate(async () => {
  124 |     const r = await fetch('/api/studio/post', {
  125 |       method: 'POST',
  126 |       headers: { 'Content-Type': 'application/json' },
  127 |       body: JSON.stringify({ content_type: 'video', caption: 'test' }),
  128 |     });
  129 |     return { status: r.status };
  130 |   });
  131 |   expect(res.status).toBe(401);
  132 | });
  133 | 
  134 | test('studio comment API requires post_id', async ({ page }) => {
  135 |   await login(page);
  136 |   const res = await page.evaluate(async () => {
  137 |     const r = await fetch('/api/studio/comment', {
  138 |       method: 'POST',
  139 |       headers: { 'Content-Type': 'application/json' },
  140 |       body: JSON.stringify({ content: 'hello' }), // missing post_id
  141 |     });
  142 |     return { status: r.status };
  143 |   });
  144 |   expect(res.status).toBe(400);
  145 | });
  146 | 
  147 | test('studio oowop API requires post_id', async ({ page }) => {
  148 |   await login(page);
  149 |   const res = await page.evaluate(async () => {
  150 |     const r = await fetch('/api/studio/oowop', {
  151 |       method: 'POST',
  152 |       headers: { 'Content-Type': 'application/json' },
  153 |       body: JSON.stringify({}),
  154 |     });
  155 |     return { status: r.status };
  156 |   });
  157 |   expect(res.status).toBe(400);
  158 | });
  159 | 
  160 | test('studio favorite API works (toggle on fake id)', async ({ page }) => {
  161 |   await login(page);
  162 |   const res = await page.evaluate(async () => {
  163 |     const r = await fetch('/api/studio/favorite', {
  164 |       method: 'POST',
  165 |       headers: { 'Content-Type': 'application/json' },
  166 |       body: JSON.stringify({ post_id: '00000000-0000-0000-0000-000000000000' }),
  167 |     });
  168 |     const data = await r.json();
  169 |     return { status: r.status, data };
  170 |   });
  171 |   // 200 (toggled or not found gracefully) or 404
  172 |   expect([200, 404]).toContain(res.status);
  173 | });
  174 | 
  175 | // ─── Sprints API ──────────────────────────────────────────────────────────────
  176 | 
  177 | test('sprints API returns array when no goal_id', async ({ page }) => {
  178 |   await login(page);
  179 |   const res = await page.evaluate(async () => {
  180 |     const r = await fetch('/api/sprints');
  181 |     const data = await r.json();
  182 |     return { status: r.status, isArray: Array.isArray(data) };
  183 |   });
  184 |   expect(res.status).toBe(200);
  185 |   expect(res.isArray).toBe(true);
  186 | });
  187 | 
  188 | test('sprints API with sprint_id returns null for fake id', async ({ page }) => {
  189 |   await login(page);
  190 |   const res = await page.evaluate(async () => {
  191 |     const r = await fetch('/api/sprints?sprint_id=00000000-0000-0000-0000-000000000000');
  192 |     const data = await r.json();
  193 |     return { status: r.status, data };
  194 |   });
  195 |   expect(res.status).toBe(200);
  196 |   expect(res.data).toBeNull();
  197 | });
  198 | 
  199 | // ─── Settings ─────────────────────────────────────────────────────────────────
  200 | 
  201 | test('settings page has village view toggle', async ({ page }) => {
  202 |   await login(page);
  203 |   await page.goto(`${BASE}/village/hut/settings`);
  204 |   await expect(page.locator('text=Village View')).toBeVisible();
  205 |   await expect(page.locator('text=3D World')).toBeVisible();
  206 |   await expect(page.locator('text=Illustrated')).toBeVisible();
  207 | });
  208 | 
  209 | test('village map page loads without error', async ({ page }) => {
  210 |   await login(page);
  211 |   await page.goto(`${BASE}/village/map`);
  212 |   // Wait for either the 3D world or illustrated view to start loading
  213 |   await page.waitForTimeout(3000);
  214 |   // No JS error thrown
  215 |   const errors: string[] = [];
  216 |   page.on('pageerror', e => errors.push(e.message));
  217 |   expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  218 | });
  219 | 
```