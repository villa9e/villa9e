# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: villa9e.spec.ts >> terms of service page has affiliate disclosure
- Location: tests/villa9e.spec.ts:36:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "https://villa9e.app/terms", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "← Back to villa9e" [ref=e4] [cursor=pointer]:
    - /url: /
  - heading "Terms of Service" [level=1] [ref=e5]
  - paragraph [ref=e6]: "Effective: May 2026 · Powered by Legaci Jackson"
  - generic [ref=e7]:
    - generic [ref=e8]:
      - heading "1. Acceptance" [level=2] [ref=e9]
      - paragraph [ref=e10]: By using villa9e, you agree to these Terms. If you are under 18, your parent or guardian must also agree. If you do not agree, do not use villa9e.
    - generic [ref=e11]:
      - heading "2. Age Requirements" [level=2] [ref=e12]
      - paragraph [ref=e13]: You must be at least 13 years old to use villa9e. Users under 13 are not permitted. Users 13–17 must have parental consent. Certain features (banking, crypto, credit) are available only to users 18+.
    - generic [ref=e14]:
      - heading "3. Your Account" [level=2] [ref=e15]
      - paragraph [ref=e16]: You are responsible for your account and all activity under it. Keep your password secure. You may not create accounts for others without their consent or create multiple accounts to game the system. villa9e reserves the right to suspend accounts that violate these Terms.
    - generic [ref=e17]:
      - heading "4. Community Standards" [level=2] [ref=e18]
      - paragraph [ref=e19]: "The Dream Line and all community spaces require respect. Prohibited: hate speech, harassment, threats, illegal content, misinformation, spam, or impersonation. Violations may result in immediate account suspension without notice or refund."
    - generic [ref=e20]:
      - heading "5. $VLG Points (Phase 1)" [level=2] [ref=e21]
      - paragraph [ref=e22]: In Phase 1, $VLG is a non-transferable, non-tradeable loyalty points system. $VLG has no cash value. villa9e reserves the right to adjust point values, conversion rates, and Phase 3 launch terms. Points may expire after 24 months of account inactivity.
    - generic [ref=e23]:
      - heading "6. Trading Post & Deals" [level=2] [ref=e24]
      - paragraph [ref=e25]: villa9e facilitates connections between buyers and sellers but is not a party to any deal. villa9e earns a platform fee on completed transactions. All disputes between parties are their own responsibility. villa9e may mediate at its discretion but is not obligated to.
    - generic [ref=e26]:
      - heading "7. Hospital & Health" [level=2] [ref=e27]
      - paragraph [ref=e28]: villa9e connects users with healthcare and wellness providers but is not a medical provider. villa9e does not provide medical advice. Healthcare providers on villa9e are independent practitioners, not employees of villa9e. Always consult a licensed professional for medical decisions.
    - generic [ref=e29]:
      - heading "8. Payments" [level=2] [ref=e30]
      - paragraph [ref=e31]: Payments are processed by Stripe. villa9e earns platform fees on transactions as disclosed. Crowdfunding contributions are non-refundable once a campaign ends. Hospital session fees may be refundable if a session is not completed — per provider policy.
    - generic [ref=e32]:
      - heading "9. Content You Create" [level=2] [ref=e33]
      - paragraph [ref=e34]: You own your content. By posting, you grant villa9e a non-exclusive license to display your content on the platform. You confirm you have the rights to post everything you share. villa9e may remove content that violates these Terms without notice.
    - generic [ref=e35]:
      - heading "10. Affiliate & Sponsored Content Disclosure" [level=2] [ref=e36]
      - paragraph [ref=e37]: Some posts, videos, and product recommendations on villa9e may be sponsored or may contain affiliate links. When a creator or villa9e earns a commission or has a material connection to content, it will be labeled "Sponsored" in the feed. This disclosure complies with FTC guidelines. Clicking affiliate links may result in villa9e or the creator earning a commission at no additional cost to you.
    - generic [ref=e38]:
      - heading "11. Limitation of Liability" [level=2] [ref=e39]
      - paragraph [ref=e40]: villa9e is provided "as is." To the maximum extent permitted by law, Legaci Jackson LLC is not liable for indirect, incidental, or consequential damages arising from your use of villa9e. Our total liability is limited to amounts you have paid us in the 12 months preceding any claim.
    - generic [ref=e41]:
      - heading "12. Governing Law" [level=2] [ref=e42]
      - paragraph [ref=e43]: These Terms are governed by the laws of the United States. Any disputes will be resolved through binding arbitration, not class action.
    - generic [ref=e44]:
      - heading "13. Contact" [level=2] [ref=e45]
      - paragraph [ref=e46]:
        - text: Legaci Jackson LLC ·
        - link "legal@villa9e.app" [ref=e47] [cursor=pointer]:
          - /url: mailto:legal@villa9e.app
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
  29  |   await page.goto(`${BASE}/privacy`);
  30  |   await expect(page.locator('h1')).toContainText('Privacy Policy');
  31  |   await expect(page.locator('text=COPPA')).toBeVisible();
  32  |   await expect(page.locator('text=Data Locker')).toBeVisible();
  33  |   await expect(page.locator('text=privacy@villa9e.app')).toBeVisible();
  34  | });
  35  | 
  36  | test('terms of service page has affiliate disclosure', async ({ page }) => {
> 37  |   await page.goto(`${BASE}/terms`);
      |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
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
  130 |   });
  131 |   expect(res.status).toBe(401);
  132 | });
  133 | 
  134 | test('studio comment API requires post_id', async ({ page }) => {
  135 |   await login(page);
  136 |   const res = await page.evaluate(async () => {
  137 |     const r = await fetch('/api/studio/comment', {
```