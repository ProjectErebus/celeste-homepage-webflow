/* /book and /book/manage against a mock of booking-api-contract.md v1. Self-contained: starts its own static
 * server (cleanUrls-style) and intercepts the API, so it ignores TEST_URL and needs no network for the API. */
import { test, expect } from '@playwright/test';
import { startServer } from './static-server.mjs';
import { createMock, API } from './mock-api.mjs';

let srv;
test.beforeAll(async () => { srv = await startServer(); });
test.afterAll(async () => { await new Promise((r) => srv.server.close(r)); });

test.use({ locale: 'en-GB', timezoneId: 'Europe/Paris' });

async function open(page, mock, path = '/book', extra = '') {
  await mock.install(page);
  await page.addInitScript(() => { try { localStorage.setItem('celeste_consent_dummy', '1'); } catch (e) {} });
  await page.goto(`${srv.url}${path}${path.includes('?') ? '&' : '?'}api=${encodeURIComponent(API)}${extra}`);
}
const posts = (mock) => mock.calls.filter((c) => c.method === 'POST' && c.path === '/api/book');

async function pickFirstSlot(page) {
  const btn = page.locator('.bk-time').first();
  await expect(btn).toBeVisible();
  const start = await btn.getAttribute('data-start');
  await btn.click();
  return start;
}
async function fill(page, over = {}) {
  await page.getByLabel('Name', { exact: true }).fill(over.name ?? 'Test Chief');
  await page.getByLabel('Email', { exact: true }).fill(over.email ?? 'chief@example.com');
  await page.getByLabel('Company', { exact: true }).fill('Test Marine');
  await page.getByLabel(/Vessel/).fill('M/Y Test');
  await page.getByLabel('Your role').selectOption('chief_engineer');
  await page.getByLabel(/Anything we should know/).fill('Looking forward to it');
}

test('page is noindex and slots render in visitor local time with organiser zone line', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
  const first = mock.slots[0];
  const expected = new Date(first.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  await expect(page.locator('.bk-time').first()).toHaveText(expected);
  await expect(page.locator('#bk-zone')).toContainText('Europe/Paris');
  await expect(page.locator('#bk-zone')).toContainText('organiser in Miami (ET)');
  expect(mock.calls[0].search).toContain('days=14');
});

test('happy path: pick slot, fill form, confirm', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  const start = await pickFirstSlot(page);
  await expect(page.locator('#bk-chosen')).toContainText('30 minutes');
  await fill(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-invite')).toHaveText('The Teams invite is on its way to chief@example.com.');
  await expect(page.getByRole('link', { name: 'Join the Teams meeting' })).toHaveAttribute('href', /teams\.microsoft\.com/);
  const sent = posts(mock)[0].body;
  expect(sent).toMatchObject({ slotStart: start, name: 'Test Chief', email: 'chief@example.com', role: 'chief_engineer', vessel: 'M/Y Test', consent: { marketing: false } });
  expect(sent.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
  expect(sent.utm).toHaveProperty('source');
  expect(sent).toHaveProperty('anonId');
});

test('marketing consent is sent only when ticked, default unticked', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await pickFirstSlot(page);
  await expect(page.getByLabel(/Send me occasional/)).not.toBeChecked();
  await fill(page);
  await page.getByLabel(/Send me occasional/).check();
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-step3')).toBeVisible();
  expect(posts(mock)[0].body.consent.marketing).toBe(true);
});

test('slot_taken: says the time just went and re-fetches slots', async ({ page }) => {
  const mock = createMock({ mode: 'slot_taken' });
  await open(page, mock);
  const start = await pickFirstSlot(page);
  await fill(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-status')).toContainText('just taken');
  await expect(page.locator('#bk-step1')).toBeVisible();
  const slotCalls = mock.calls.filter((c) => c.path === '/api/book/slots');
  expect(slotCalls.length).toBe(2);
  await expect(page.locator(`.bk-time[data-start="${start}"]`)).toHaveCount(0);
});

test('booking_disabled on POST: calm message plus mailto fallback', async ({ page }) => {
  const mock = createMock({ mode: 'booking_disabled' });
  await open(page, mock);
  await pickFirstSlot(page);
  await fill(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-status')).toContainText('not available just now');
  await expect(page.locator('#bk-status a')).toHaveAttribute('href', 'mailto:onboarding@celeste7.ai');
});

test('booking_disabled on slots GET: message plus mailto, no slot buttons', async ({ page }) => {
  const mock = createMock({ slotsMode: 'booking_disabled' });
  await open(page, mock);
  await expect(page.locator('#bk-status a')).toHaveAttribute('href', 'mailto:onboarding@celeste7.ai');
  await expect(page.locator('.bk-time')).toHaveCount(0);
});

test('rate_limited shows calm message plus mailto', async ({ page }) => {
  const mock = createMock({ mode: 'rate_limited' });
  await open(page, mock);
  await pickFirstSlot(page);
  await fill(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-status')).toContainText('wait a little');
  await expect(page.locator('#bk-status a')).toHaveAttribute('href', 'mailto:onboarding@celeste7.ai');
});

test('honeypot website field is hidden from users and sent empty', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await pickFirstSlot(page);
  await fill(page);
  await expect(page.locator('#bk-website')).not.toBeInViewport();
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-step3')).toBeVisible();
  expect(posts(mock)[0].body.website).toBe('');
});

test('slot buttons are keyboard operable', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  const btn = page.locator('.bk-time').first();
  await btn.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#bk-step2')).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true })).toBeFocused();
});

test('phone viewport 390px: no horizontal scroll, full flow works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const mock = createMock();
  await open(page, mock);
  await pickFirstSlot(page);
  await fill(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-invite')).toBeVisible();
});

test('manage: cancel happy path', async ({ page }) => {
  const mock = createMock();
  await open(page, mock, '/book/manage?id=cb_test1&t=goodtoken');
  await page.getByRole('button', { name: 'Cancel this booking' }).click();
  await page.getByRole('button', { name: 'Yes, cancel my booking' }).click();
  await expect(page.locator('#bk-status')).toContainText('cancelled');
  const c = mock.calls.find((x) => x.path === '/api/book/cb_test1/cancel');
  expect(c.body).toEqual({ token: 'goodtoken' });
});

test('manage: bad token shows a clear message', async ({ page }) => {
  const mock = createMock();
  await open(page, mock, '/book/manage?id=cb_test1&t=WRONG');
  await page.getByRole('button', { name: 'Cancel this booking' }).click();
  await page.getByRole('button', { name: 'Yes, cancel my booking' }).click();
  await expect(page.locator('#bk-status')).toContainText('not valid');
});

test('manage: reschedule picks a new time', async ({ page }) => {
  const mock = createMock();
  await open(page, mock, '/book/manage?id=cb_test1&t=goodtoken');
  await page.getByRole('button', { name: 'Pick a new time' }).click();
  const start = await pickFirstSlot(page);
  await expect(page.locator('#bk-status')).toContainText('Your call is now');
  const c = mock.calls.find((x) => x.path === '/api/book/cb_test1/reschedule');
  expect(c.body).toEqual({ token: 'goodtoken', slotStart: start });
});

test('manage: missing id or token', async ({ page }) => {
  const mock = createMock();
  await open(page, mock, '/book/manage');
  await expect(page.locator('#bk-status')).toContainText('incomplete');
});

/* ---- review D hardening ---- */
const PROD_API = 'https://control.celeste7.ai';
// Serve the local site under a non-local hostname so the page runs in "production mode".
async function openAsProd(page, query) {
  await page.route('https://celeste7.test/**', async (route) => {
    const u = new URL(route.request().url());
    const r = await route.fetch({ url: srv.url + u.pathname + u.search });
    await route.fulfill({ response: r });
  });
  await page.goto('https://celeste7.test/book' + query);
}

test('production host ignores ?api= override: data goes only to control.celeste7.ai', async ({ page }) => {
  const prod = createMock(), evil = createMock();
  await prod.install(page, PROD_API);
  await evil.install(page, 'https://evil.test');
  await openAsProd(page, '?api=' + encodeURIComponent('https://evil.test'));
  await pickFirstSlot(page);
  await fill(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-step3')).toBeVisible();
  expect(evil.calls.length).toBe(0);
  expect(prod.calls.some((c) => c.path === '/api/book' && c.method === 'POST')).toBe(true);
});

test('javascript: joinUrl and off-site / http manageUrl are not rendered', async ({ page }) => {
  const mock = createMock();
  mock.joinUrl = 'javascript:void(window.__pwned=1)';
  mock.manageUrl = 'https://evil.example/book/manage?id=x&t=y';
  await open(page, mock);
  await pickFirstSlot(page);
  await fill(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-step3')).toBeVisible();
  await expect(page.locator('#bk-join')).toBeHidden();
  await expect(page.locator('#bk-manage')).toBeHidden();
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
});

test('valid https join link and celeste7.ai manage link are rendered', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await pickFirstSlot(page);
  await fill(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-join')).toBeVisible();
  await expect(page.locator('#bk-manage')).toBeVisible();
});

test('retry after a lost response reuses the idempotency key; changed data gets a new key', async ({ page }) => {
  const mock = createMock();
  mock.dropFirstResponse = true;
  await open(page, mock);
  await pickFirstSlot(page);
  await fill(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-status')).toContainText('Something went wrong');
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-step3')).toBeVisible();
  const p = posts(mock);
  expect(p.length).toBe(2);
  expect(p[1].body.idempotencyKey).toBe(p[0].body.idempotencyKey);
});

test('changing the form between attempts generates a new idempotency key', async ({ page }) => {
  const mock = createMock({ mode: 'rate_limited' });
  await open(page, mock);
  await pickFirstSlot(page);
  await fill(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-status')).toContainText('wait a little');
  await page.getByLabel('Company', { exact: true }).fill('Other Marine');
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-status')).toContainText('wait a little');
  const p = posts(mock);
  expect(p[1].body.idempotencyKey).not.toBe(p[0].body.idempotencyKey);
});

test('dryRun response says test booking, no invite, no join link', async ({ page }) => {
  const mock = createMock();
  mock.dryRun = true;
  await open(page, mock);
  await pickFirstSlot(page);
  await fill(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-invite')).toContainText('test booking');
  await expect(page.locator('#bk-invite')).toContainText('no invite has been sent');
  await expect(page.locator('#bk-invite')).not.toContainText('on its way');
  await expect(page.locator('#bk-join')).toBeHidden();
});
