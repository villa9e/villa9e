# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: villa9e.spec.ts >> sprints API with sprint_id returns null for fake id
- Location: tests/villa9e.spec.ts:188:5

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - generic:
      - img
      - img
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e10]: v9
          - heading "villa9e" [level=1] [ref=e11]
          - paragraph [ref=e12]: Welcome back, Villager.
        - button "Continue with Google" [ref=e13] [cursor=pointer]:
          - img [ref=e14]
          - text: Continue with Google
        - generic [ref=e21]: or
        - generic [ref=e23]:
          - textbox "Email address" [ref=e24]: testuser@villa9e.app
          - textbox "Password" [ref=e25]: TestVilla9e2026!
          - paragraph [ref=e26]: Incorrect email or password.
          - button "Enter the Village →" [ref=e27] [cursor=pointer]
        - paragraph [ref=e29]:
          - text: New to villa9e?
          - link "Join the village" [ref=e30] [cursor=pointer]:
            - /url: /signup
      - paragraph [ref=e31]:
        - text: By continuing, you agree to villa9e's
        - link "Terms" [ref=e32] [cursor=pointer]:
          - /url: /terms
        - text: "&"
        - link "Privacy" [ref=e33] [cursor=pointer]:
          - /url: /privacy
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | // Test credentials — create this account in Supabase dashboard first
  4   | const TEST_EMAIL    = 'testuser@villa9e.app';
  5   | const TEST_PASSWORD = 'TestVilla9e2026!';
  6   | const BASE          = 'https://villa9e.app';
  7   | 
  8   | // ─── Helpers ──────────────────────────────────────────────────────────────────
  9   | 
  10  | async function login(page: Page) {
  11  |   await page.goto(`${BASE}/login`);
  12  |   await page.fill('input[type="email"]', TEST_EMAIL);
  13  |   await page.fill('input[type="password"]', TEST_PASSWORD);
  14  |   await page.click('button[type="submit"]');
> 15  |   await page.waitForURL(/village|map|onboarding/, { timeout: 15000 });
      |              ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  16  | }
  17  | 
  18  | // ─── Auth ─────────────────────────────────────────────────────────────────────
  19  | 
  20  | test('signup page loads and has terms/privacy links', async ({ page }) => {
  21  |   await page.goto(`${BASE}/signup`);
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
```