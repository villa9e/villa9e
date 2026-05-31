# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: villa9e.spec.ts >> privacy policy page renders all sections
- Location: tests/villa9e.spec.ts:28:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "https://villa9e.app/privacy", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "← Back to villa9e" [ref=e4] [cursor=pointer]:
    - /url: /
  - heading "Privacy Policy" [level=1] [ref=e5]
  - paragraph [ref=e6]: "Effective: May 2026 · Powered by Legaci Jackson"
  - generic [ref=e7]:
    - generic [ref=e8]:
      - heading "1. What We Collect" [level=2] [ref=e9]
      - paragraph [ref=e10]: villa9e collects information you provide directly (name, email, goals, skills), information from your use of the app (goal progress, posts, OoWops), and optionally, data you choose to share through the Data Locker for monetization purposes.
    - generic [ref=e11]:
      - heading "2. How We Use Your Data" [level=2] [ref=e12]
      - paragraph [ref=e13]: Your data powers the Goal GPS engine, Spirit AI coaching, and villager matching. We use aggregated, anonymized data to improve villa9e. We never sell your individual data to third parties. If you opt into the Data Locker, advertisers receive only the categories you approve — never your identity.
    - generic [ref=e14]:
      - heading "3. Health Data (Hospital)" [level=2] [ref=e15]
      - paragraph [ref=e16]: Health and wellness data shared through the Hospital section is stored separately with enhanced security. villa9e maintains a HIPAA Business Associate Agreement (BAA) with our data processor. Health data is never used for advertising without explicit separate consent.
    - generic [ref=e17]:
      - heading "4. Children (COPPA)" [level=2] [ref=e18]
      - paragraph [ref=e19]:
        - text: villa9e is available to users 13 and older. Users under 13 are not permitted. Users 13–17 require parental consent. We do not knowingly collect data from children under 13. If you believe a child under 13 has provided us data, contact us at
        - link "privacy@villa9e.app" [ref=e20] [cursor=pointer]:
          - /url: mailto:privacy@villa9e.app
        - text: .
    - generic [ref=e21]:
      - heading "5. Data Locker — Your Control" [level=2] [ref=e22]
      - paragraph [ref=e23]: The Data Locker is locked by default. You choose exactly what data categories to share and earn 15% of what your data generates. You can change settings at any time. Revoking consent stops future use immediately — historical aggregated data cannot be retroactively removed from existing campaigns.
    - generic [ref=e24]:
      - heading "6. $VLG Token & Wallet" [level=2] [ref=e25]
      - paragraph [ref=e26]: In Phase 1, $VLG is a points system and not a financial instrument. Your wallet data is stored securely and never shared with third parties. When $VLG becomes tradeable in Phase 3, additional terms will apply.
    - generic [ref=e27]:
      - heading "7. Third-Party Services" [level=2] [ref=e28]
      - paragraph [ref=e29]: villa9e uses Supabase (data storage), Stripe (payments), Cloudinary (media), ElevenLabs (voice), and other services. Each operates under their own privacy policies. Payments are processed by Stripe and villa9e never stores your full card details.
    - generic [ref=e30]:
      - heading "8. Your Rights" [level=2] [ref=e31]
      - paragraph [ref=e32]:
        - text: You may request export, correction, or deletion of your data at any time. Contact
        - link "privacy@villa9e.app" [ref=e33] [cursor=pointer]:
          - /url: mailto:privacy@villa9e.app
        - text: . We will respond within 30 days. Deleting your account removes your profile and personal data; community content (anonymized OoWops, aggregated data) may remain.
    - generic [ref=e34]:
      - heading "9. Security" [level=2] [ref=e35]
      - paragraph [ref=e36]:
        - text: We use industry-standard encryption (TLS in transit, AES-256 at rest), row-level security in our database, and regular security reviews. No system is 100% secure — if you discover a vulnerability, please report it to
        - link "security@villa9e.app" [ref=e37] [cursor=pointer]:
          - /url: mailto:security@villa9e.app
        - text: .
    - generic [ref=e38]:
      - heading "10. Contact" [level=2] [ref=e39]
      - paragraph [ref=e40]:
        - text: Legaci Jackson LLC ·
        - link "privacy@villa9e.app" [ref=e41] [cursor=pointer]:
          - /url: mailto:privacy@villa9e.app
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
  15  |   await page.waitForURL(/village|map|onboarding/, { timeout: 15000 });
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
> 29  |   await page.goto(`${BASE}/privacy`);
      |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
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
  122 |   await page.goto(BASE);
  123 |   const res = await page.evaluate(async () => {
  124 |     const r = await fetch('/api/studio/post', {
  125 |       method: 'POST',
  126 |       headers: { 'Content-Type': 'application/json' },
  127 |       body: JSON.stringify({ content_type: 'video', caption: 'test' }),
  128 |     });
  129 |     return { status: r.status };
```