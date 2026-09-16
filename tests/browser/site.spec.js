const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // Third-party map availability is outside this site's release gate.
  await page.route('https://www.openstreetmap.org/**', route => route.fulfill({ body: '<html></html>', contentType: 'text/html' }));
  await page.route('**/api/contact', route => route.request().method() === 'GET'
    ? route.fulfill({ contentType: 'application/json', body: '{"available":true}' })
    : route.fallback());
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

test('contact form validates, sends, and keeps text when delivery fails', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  let requests = 0;
  let fail = true;
  await page.route('**/api/contact', async route => {
    if (route.request().method() === 'GET') return route.fallback();
    requests++;
    expect(route.request().postDataJSON().email).toBe('visitor@example.com');
    await route.fulfill({ status: fail ? 503 : 200, contentType: 'application/json', body: JSON.stringify({ message: fail ? 'Unavailable' : 'Message sent successfully.' }) });
  });
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  expect(requests).toBe(0);
  await page.getByLabel('Full Name', { exact: true }).fill('Test Visitor');
  await page.getByLabel('Email Address', { exact: true }).fill('visitor@example.com');
  await page.getByLabel('Subject', { exact: true }).fill('Project enquiry');
  await page.getByLabel('Message', { exact: true }).fill('I would like to discuss a project.');
  await page.clock.fastForward(3000);
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('could not be sent');
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('I would like to discuss a project.');
  fail = false;
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('sent successfully');
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('');
  expect(requests).toBe(2);
});

test('configured verification widget supplies a token and resets after submission', async ({ page }) => {
  await page.route('**/api/contact', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ contentType: 'application/json', body: '{"available":true,"siteKey":"test-site"}' });
    expect(route.request().postDataJSON()['cf-turnstile-response']).toBe('test-token');
    return route.fulfill({ contentType: 'application/json', body: '{"message":"Message sent successfully."}' });
  });
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', route => route.fulfill({ contentType: 'application/javascript', body: `window.turnstile = {
    render(container, options) {
      const input = document.createElement('input'); input.type = 'hidden'; input.name = 'cf-turnstile-response'; input.value = 'test-token'; container.append(input);
      container.setAttribute('data-test-widget', options.action); return 'widget';
    }, reset() { document.querySelector('[name="cf-turnstile-response"]').value = ''; }
  };` }));
  await page.goto('/');
  await expect(page.locator('[data-test-widget="contact"]')).toHaveCount(1);
  await page.getByLabel('Full Name', { exact: true }).fill('Test Visitor');
  await page.getByLabel('Email Address', { exact: true }).fill('visitor@example.com');
  await page.getByLabel('Subject', { exact: true }).fill('Project enquiry');
  await page.getByLabel('Message', { exact: true }).fill('I would like to discuss a project.');
  // Exercise the site's minimum elapsed-time check without sending real email.
  await page.waitForTimeout(2600);
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('sent successfully');
  await expect(page.locator('[name="cf-turnstile-response"]')).toHaveValue('');
});
