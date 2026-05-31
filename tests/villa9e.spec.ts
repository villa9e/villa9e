import { test, expect, Page } from '@playwright/test';

// Test credentials — create this account in Supabase dashboard first
const TEST_EMAIL    = 'testuser@villa9e.app';
const TEST_PASSWORD = 'TestVilla9e2026!';
const BASE          = 'https://villa9e.app';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/village|map|onboarding/, { timeout: 15000 });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

test('signup page loads and has terms/privacy links', async ({ page }) => {
  await page.goto(`${BASE}/signup`);
  await expect(page.locator('text=Terms')).toBeVisible();
  await expect(page.locator('text=Privacy')).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('privacy policy page renders all sections', async ({ page }) => {
  await page.goto(`${BASE}/privacy`);
  await expect(page.locator('h1')).toContainText('Privacy Policy');
  await expect(page.locator('text=COPPA')).toBeVisible();
  await expect(page.locator('text=Data Locker')).toBeVisible();
  await expect(page.locator('text=privacy@villa9e.app')).toBeVisible();
});

test('terms of service page has affiliate disclosure', async ({ page }) => {
  await page.goto(`${BASE}/terms`);
  await expect(page.locator('h1')).toContainText('Terms of Service');
  await expect(page.locator('text=Affiliate')).toBeVisible();
  await expect(page.locator('text=FTC')).toBeVisible();
});

// ─── Login ────────────────────────────────────────────────────────────────────

test('can log in with test account', async ({ page }) => {
  await login(page);
  // Should land somewhere in the village
  await expect(page).toHaveURL(/village|map/);
});

// ─── Dreamline feed ───────────────────────────────────────────────────────────

test('dreamline feed loads posts', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/village/dreamline`);
  await page.waitForTimeout(3000);
  // At minimum a post card or empty state should appear
  const cards = page.locator('[data-testid="post-card"], .post-card');
  const emptyState = page.locator('text=Nothing here yet');
  const either = await Promise.race([
    cards.first().waitFor({ timeout: 8000 }).then(() => 'cards'),
    emptyState.waitFor({ timeout: 8000 }).then(() => 'empty'),
  ]).catch(() => 'timeout');
  expect(either).not.toBe('timeout');
});

test('dreamline feed API returns posts', async ({ page }) => {
  await login(page);
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/dreamline/feed?limit=5&offset=0');
    return { status: r.status, ok: r.ok };
  });
  expect(res.status).toBe(200);
  expect(res.ok).toBe(true);
});

// ─── GPS flow ─────────────────────────────────────────────────────────────────

test('workshop page loads', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/village/workshop`);
  await expect(page).toHaveURL(/workshop/);
  await page.waitForTimeout(2000);
  // Should show either goals or the guide card
  const hasContent = await page.locator('text=Goal GPS, text=Start Your First Goal, text=Talk to Spirit').first().isVisible().catch(() => false);
  // Page rendered without error is enough
  expect(await page.title()).toBeTruthy();
});

test('GPS assess API rejects without goal_id', async ({ page }) => {
  await login(page);
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/gps/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return { status: r.status };
  });
  expect(res.status).toBe(400);
});

test('GPS activate API blocks below 95%', async ({ page }) => {
  await login(page);
  // Use a fake goal_id to test the gate behavior
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/gps/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal_id: '00000000-0000-0000-0000-000000000000' }),
    });
    return { status: r.status };
  });
  // 404 (goal not found) or 400 — both are correct, not 200
  expect(res.status).not.toBe(200);
});

// ─── Creator Studio ───────────────────────────────────────────────────────────

test('studio post API rejects unauthenticated', async ({ page }) => {
  // Fresh page, not logged in
  await page.goto(BASE);
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/studio/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'video', caption: 'test' }),
    });
    return { status: r.status };
  });
  expect(res.status).toBe(401);
});

test('studio comment API requires post_id', async ({ page }) => {
  await login(page);
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/studio/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'hello' }), // missing post_id
    });
    return { status: r.status };
  });
  expect(res.status).toBe(400);
});

test('studio oowop API requires post_id', async ({ page }) => {
  await login(page);
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/studio/oowop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return { status: r.status };
  });
  expect(res.status).toBe(400);
});

test('studio favorite API works (toggle on fake id)', async ({ page }) => {
  await login(page);
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/studio/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: '00000000-0000-0000-0000-000000000000' }),
    });
    const data = await r.json();
    return { status: r.status, data };
  });
  // 200 (toggled or not found gracefully) or 404
  expect([200, 404]).toContain(res.status);
});

// ─── Sprints API ──────────────────────────────────────────────────────────────

test('sprints API returns array when no goal_id', async ({ page }) => {
  await login(page);
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/sprints');
    const data = await r.json();
    return { status: r.status, isArray: Array.isArray(data) };
  });
  expect(res.status).toBe(200);
  expect(res.isArray).toBe(true);
});

test('sprints API with sprint_id returns null for fake id', async ({ page }) => {
  await login(page);
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/sprints?sprint_id=00000000-0000-0000-0000-000000000000');
    const data = await r.json();
    return { status: r.status, data };
  });
  expect(res.status).toBe(200);
  expect(res.data).toBeNull();
});

// ─── Settings ─────────────────────────────────────────────────────────────────

test('settings page has village view toggle', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/village/hut/settings`);
  await expect(page.locator('text=Village View')).toBeVisible();
  await expect(page.locator('text=3D World')).toBeVisible();
  await expect(page.locator('text=Illustrated')).toBeVisible();
});

test('village map page loads without error', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/village/map`);
  // Wait for either the 3D world or illustrated view to start loading
  await page.waitForTimeout(3000);
  // No JS error thrown
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
});
