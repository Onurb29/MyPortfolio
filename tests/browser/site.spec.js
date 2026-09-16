const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // Third-party map availability is outside this site's release gate.
  await page.route('https://www.openstreetmap.org/**', route => route.fulfill({ body: '<html></html>', contentType: 'text/html' }));
});

test('portfolio navigation and social links work without page overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Turning complexity');
  await expect(page.locator('.social-links a')).toHaveCount(3);
  await expect(page.locator('iframe[title="Interactive map of Terrace, British Columbia"]')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: /Explore the homelab/ }).click();
  await expect(page).toHaveURL(/\/homelab\//);
  await expect(page.locator('[data-node="engine"]')).toBeVisible();
});

test('homelab tabs, node details, connections and reset work', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/homelab/');
  await page.locator('[data-panel="platform"]').click();
  await expect(page.locator('#platform')).toBeVisible();
  await page.locator('[data-panel="overview"]').click();
  const server = page.locator('[data-node="engine"]');
  await server.click();
  await expect(server).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.detail-connections')).toContainText('Portainer');
  await expect(page.locator('.map-edge.highlight').first()).toBeAttached();
  await page.keyboard.press('Escape');
  await expect(server).toHaveAttribute('aria-pressed', 'false');
  await server.click();
  await page.locator('#reset-map').click();
  await expect(server).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
