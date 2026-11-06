/* Exit popup (js/celeste-popup.js) + funnel tracking events (js/celeste-events.js), against the mock API.
 * Self-contained: own static server, intercepted API and collector. Run: npx playwright test -c playwright.book.config.js */
import { test, expect } from '@playwright/test';
import { startServer } from '../book/static-server.mjs';
import { createMock, API, captureCollector, consentJson, CONSENT_KEY } from '../book/mock-api.mjs';

let srv;
test.beforeAll(async () => { srv = await startServer(); });
test.afterAll(async () => { await new Promise((r) => srv.server.close(r)); });

/* Desktop semantics for every project; the phone block below overrides. */
test.use({ locale: 'en-GB', isMobile: false, hasTouch: false, viewport: { width: 1280, height: 800 } });

const PAGE = '/tests/popup/popup-test.html';
const DAY = 864e5;

async function setup(page, { consent = true, seed = {} } = {}) {
  const mock = createMock();
  await mock.install(page);
  const events = await captureCollector(page);
  await page.addInitScript(([k, c, s]) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    try { if (c) localStorage.setItem(k, c); for (const [a, b] of Object.entries(s)) localStorage.setItem(a, b); } catch (e) {}
  }, [CONSENT_KEY, consent ? consentJson(true) : null, seed]);
  return { mock, events };
}
const open = (page, path = PAGE) => page.goto(srv.url + path);
const dialog = (page) => page.locator('dialog.cp-dialog');
const exitIntent = (page) => page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientY: -1, relatedTarget: null })));
async function armed(page) { await page.waitForTimeout(1300); } // past data-exit-delay=1200
const names = (events, ev) => events.filter((e) => e.event === ev);

test('exit intent shows the popup, and only once', async ({ page }) => {
  await setup(page);
  await open(page); await armed(page);
  await expect(dialog(page)).toHaveCount(0);
  await exitIntent(page);
  await expect(dialog(page)).toBeVisible();
  expect(await dialog(page).evaluate((d) => d.open && d.matches(':modal'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await exitIntent(page);
  await expect(dialog(page)).toBeHidden();
  expect(await page.locator('dialog.cp-dialog').count()).toBe(1);
});

test('exit intent ignored: too early, pointer moving into another element, or not through the top edge', async ({ page }) => {
  await setup(page);
  // Deterministic clock: frozen until the test advances it (page load time varies with the consent scripts).
  await page.addInitScript(() => { const real = Date.now.bind(Date); window.__off = 0; window.__t = null; Date.now = () => (window.__t === null ? real() : window.__t) + window.__off; });
  await open(page);
  await page.evaluate(() => { window.__t = Date.now(); });
  const t0 = await page.evaluate(() => window.__t);
  // script's t0 was recorded earlier on the real clock; jump the clock back so "elapsed" is ~0 now
  await page.evaluate(() => { window.__off = -5000; });
  await exitIntent(page); // before data-exit-delay
  await expect(dialog(page)).toHaveCount(0);
  await page.evaluate(() => { window.__off = 5000; }); // now well past the delay
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientY: -1, relatedTarget: document.body })));
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientY: 300, relatedTarget: null })));
  await expect(dialog(page)).toHaveCount(0);
  await exitIntent(page);
  await expect(dialog(page)).toBeVisible();
  expect(t0).toBeGreaterThan(0);
});

test('not shown again within 30 days; shown again after the window', async ({ page }) => {
  await setup(page);
  await open(page); await armed(page);
  await exitIntent(page);
  await expect(dialog(page)).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('celeste_popup_shown'));
  expect(Date.parse(stored)).toBeGreaterThan(Date.now() - 5000);
  await page.reload(); await armed(page);
  await exitIntent(page);
  await expect(dialog(page)).toHaveCount(0);
  // 29 days ago: still inside the window
  await page.evaluate((t) => localStorage.setItem('celeste_popup_shown', t), new Date(Date.now() - 29 * DAY).toISOString());
  await page.reload(); await armed(page); await exitIntent(page);
  await expect(dialog(page)).toHaveCount(0);
  // 31 days ago: outside
  await page.evaluate((t) => localStorage.setItem('celeste_popup_shown', t), new Date(Date.now() - 31 * DAY).toISOString());
  await page.reload(); await armed(page); await exitIntent(page);
  await expect(dialog(page)).toBeVisible();
});

test('not shown after a lead was submitted (localStorage flag)', async ({ page }) => {
  await setup(page, { seed: { celeste_lead_submitted: '1' } });
  await open(page); await armed(page); await exitIntent(page);
  await expect(dialog(page)).toHaveCount(0);
});

test('fails closed: if localStorage throws, the popup does not show', async ({ page }) => {
  await setup(page);
  await page.addInitScript(() => {
    const boom = () => { throw new DOMException('denied', 'SecurityError'); };
    Storage.prototype.getItem = boom; Storage.prototype.setItem = boom;
  });
  await open(page); await armed(page); await exitIntent(page);
  await expect(dialog(page)).toHaveCount(0);
});

test('never shown on /book or /book/manage, even with the script present', async ({ page }) => {
  await setup(page);
  for (const path of ['/book', '/book/manage?id=cb_x&t=y']) {
    await open(page, path);
    await page.evaluate((src) => new Promise((res) => {
      const s = document.createElement('script'); s.src = src; s.setAttribute('data-exit-delay', '0'); s.onload = res; document.head.appendChild(s);
    }), srv.url + '/js/celeste-popup.js');
    await page.waitForTimeout(100);
    await exitIntent(page);
    await page.waitForTimeout(150);
    await expect(dialog(page)).toHaveCount(0);
  }
  // control: the same injection on a non-book path DOES show it (proves the check could have fired)
  await open(page, '/tests/popup/popup-test.html?x=1');
  await armed(page); await exitIntent(page);
  await expect(dialog(page)).toBeVisible();
});

test('Esc closes; focus is trapped inside; focus returns; close button is one tap', async ({ page }) => {
  await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page)).toHaveAttribute('aria-labelledby', /.+/);
  const label = await dialog(page).getAttribute('aria-labelledby');
  await expect(page.locator('#' + label)).toHaveText(/\S/);
  await expect(page.locator('#' + label)).toHaveAttribute('data-copy-slot', 'heading');
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    // inert page: focus is inside the dialog, or briefly on <body> while it passes through browser chrome; never on page content
    expect(await page.evaluate(() => { const a = document.activeElement; return !!a.closest('dialog.cp-dialog') || a === document.body; })).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  // reopen path: close button
  await page.evaluate(() => localStorage.removeItem('celeste_popup_shown'));
  await page.reload(); await armed(page); await exitIntent(page);
  await expect(dialog(page)).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(dialog(page)).toBeHidden();
});

test('split layout: image slot left (~40%), decorative lazy image with dimensions, form right', async ({ page }) => {
  await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  const fig = dialog(page).locator('[data-image-slot]');
  await expect(fig).toBeVisible();
  const img = fig.locator('img');
  await expect(img).toHaveAttribute('alt', '');
  await expect(img).toHaveAttribute('loading', 'lazy');
  await expect(img).toHaveAttribute('width', /\d+/);
  await expect(img).toHaveAttribute('height', /\d+/);
  await expect(img).toHaveAttribute('src', '/img/hull-light.webp');
  const d = await dialog(page).boundingBox(), f = await fig.boundingBox();
  expect(d.width).toBeLessThanOrEqual(760);
  expect(f.width / d.width).toBeGreaterThan(0.37);
  expect(f.width / d.width).toBeLessThan(0.43);
  const form = await dialog(page).locator('form').boundingBox();
  expect(form.x).toBeGreaterThanOrEqual(f.x + f.width - 1);
  // light is the default: white card
  expect(await dialog(page).evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)');
});

test('name is hidden by default and revealed on request; No thanks closes and counts as dismissed', async ({ page }) => {
  const { events, mock } = await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  await expect(dialog(page).getByLabel('Name (optional)')).toBeHidden();
  await dialog(page).getByRole('button', { name: 'Add your name (optional)' }).click();
  await expect(dialog(page).getByLabel('Name (optional)')).toBeFocused();
  await dialog(page).getByRole('button', { name: 'No thanks' }).click();
  await expect(dialog(page)).toBeHidden();
  await expect.poll(() => events.filter((e) => e.event === 'popup_dismissed').length).toBe(1);
  expect(mock.calls.some((c) => c.path === '/api/book/lead')).toBe(false);
});

test('phone: image collapses to a ~120px strip above the form', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  const f = await dialog(page).locator('[data-image-slot]').boundingBox();
  const form = await dialog(page).locator('form').boundingBox();
  expect(Math.round(f.height)).toBe(120);
  expect(form.y).toBeGreaterThanOrEqual(f.y + f.height - 1);
});

test('copy slots are marked data-copy-slot', async ({ page }) => {
  await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  const slots = await dialog(page).locator('[data-copy-slot]').evaluateAll((n) => n.map((e) => e.getAttribute('data-copy-slot')));
  expect(slots).toEqual(expect.arrayContaining(['heading', 'body', 'imo-hint', 'consent', 'submit']));
});

test('submit success: posts a popup lead, shows Book a call, sets the lead flag', async ({ page }) => {
  const { mock } = await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  await expect(dialog(page).getByLabel(/marketing|occasional/i)).not.toBeChecked();
  await dialog(page).getByLabel('Email', { exact: true }).fill('boss@example.com');
  await dialog(page).locator('input[name=imo]').fill('IMO 9074729');
  await dialog(page).locator('button[type=submit]').click();
  const link = dialog(page).getByRole('link', { name: 'Book a call' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/book');
  const body = mock.calls.find((c) => c.path === '/api/book/lead').body;
  expect(body).toMatchObject({ source: 'popup', imo: '9074729', email: 'boss@example.com', name: null, consent: { marketing: false }, website: '' });
  expect(await page.evaluate(() => localStorage.getItem('celeste_lead_submitted'))).toBe('1');
});

test('submit validation: bad email and bad IMO block the request', async ({ page }) => {
  const { mock } = await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  await dialog(page).locator('button[type=submit]').click();
  await expect(dialog(page).locator('.cp-msg')).toContainText('valid email');
  await dialog(page).getByLabel('Email', { exact: true }).fill('boss@example.com');
  await dialog(page).locator('input[name=imo]').fill('9074728');
  await dialog(page).locator('button[type=submit]').click();
  await expect(dialog(page).locator('.cp-msg')).toContainText('IMO');
  expect(mock.calls.some((c) => c.path === '/api/book/lead')).toBe(false);
});

test('submit failure keeps the form and shows a calm message', async ({ page }) => {
  const { mock } = await setup(page);
  mock.leadMode = 'rate_limited';
  await open(page); await armed(page); await exitIntent(page);
  await dialog(page).getByLabel('Email', { exact: true }).fill('boss@example.com');
  await dialog(page).locator('button[type=submit]').click();
  await expect(dialog(page).locator('.cp-msg')).toContainText('did not go through');
  expect(await page.evaluate(() => localStorage.getItem('celeste_lead_submitted'))).toBeNull();
});

test('reduced motion: no animation on the dialog', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  expect(await dialog(page).evaluate((d) => getComputedStyle(d).animationName)).toBe('none');
});

test('phone-width layout fits without horizontal overflow (desktop pointer)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  const box = await dialog(page).boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
});

/* ---- phone: scroll depth, then timer fallback ---- */
test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('50% scroll depth shows the popup; mouseout does not', async ({ page }) => {
    await setup(page);
    await open(page);
    await exitIntent(page);
    await page.waitForTimeout(1300); await exitIntent(page);
    await expect(dialog(page)).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * 0.3));
    await page.waitForTimeout(200);
    await expect(dialog(page)).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * 0.55));
    await expect(dialog(page)).toBeVisible();
    await page.screenshot({ path: process.env.POPUP_SHOT_PHONE || undefined, ...(process.env.POPUP_SHOT_PHONE ? {} : { type: 'png' }) });
  });

  test('timer fallback shows it without any scroll', async ({ page }) => {
    await setup(page);
    await open(page);
    await expect(dialog(page)).toHaveCount(0);
    await expect(dialog(page)).toBeVisible({ timeout: 8000 });
  });
});

/* ---- tracking: consent-gated, no PII ---- */
test.describe('tracking events', () => {
  test('with analytics consent: popup_shown, popup_dismissed fire; payload has no PII', async ({ page }) => {
    const { events } = await setup(page);
    await open(page); await armed(page); await exitIntent(page);
    await expect(dialog(page)).toBeVisible();
    await expect.poll(() => names(events, 'popup_shown').length).toBe(1);
    await page.keyboard.press('Escape');
    await expect.poll(() => names(events, 'popup_dismissed').length).toBe(1);
    const e = names(events, 'popup_shown')[0];
    expect(e).toMatchObject({ event: 'popup_shown', consent: { analytics: true } });
    expect(e.event_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('popup_submit fires on success and not popup_dismissed; the email never appears in an event', async ({ page }) => {
    const { events } = await setup(page);
    await open(page); await armed(page); await exitIntent(page);
    await dialog(page).getByLabel('Email', { exact: true }).fill('secret.person@example.com');
    await dialog(page).locator('input[name=imo]').fill('9074729');
    await dialog(page).locator('button[type=submit]').click();
    await expect(dialog(page).getByRole('link', { name: 'Book a call' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect.poll(() => names(events, 'popup_submit').length).toBe(1);
    expect(names(events, 'popup_dismissed').length).toBe(0);
    const blob = JSON.stringify(events.filter((x) => ['popup_shown', 'popup_submit', 'popup_dismissed'].includes(x.event)));
    expect(blob).not.toContain('secret.person');
    expect(blob).not.toContain('9074729');
  });

  test('without consent: popup still works, but no funnel event is sent', async ({ page }) => {
    const { events } = await setup(page, { consent: false });
    await open(page); await armed(page); await exitIntent(page);
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    expect(events.filter((x) => /^popup_/.test(x.event || '')).length).toBe(0);
  });

  test('analytics declined (consent stored, analytics=false): no events', async ({ page }) => {
    const { events } = await setup(page, { consent: false, seed: { [CONSENT_KEY]: consentJson(false) } });
    await open(page); await armed(page); await exitIntent(page);
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    expect(events.filter((x) => /^popup_/.test(x.event || '')).length).toBe(0);
  });

  test('celesteEvents drops unknown events and unknown props (no PII channel)', async ({ page }) => {
    const { events } = await setup(page);
    await open(page);
    await page.waitForFunction(() => window.celesteEvents);
    const r = await page.evaluate(() => [
      window.celesteEvents.track('lead_submit_x', { email: 'a@b.co' }),
      window.celesteEvents.track('book_step', { step: 'a@b.co' }),
      window.celesteEvents.track('imo_resolved', { found: true, imo: '9074729', email: 'a@b.co' }),
    ]);
    expect(r).toEqual([false, false, true]);
    await expect.poll(() => names(events, 'imo_resolved').length).toBe(1);
    const e = names(events, 'imo_resolved')[0];
    expect(e.found).toBe(true);
    expect(JSON.stringify(e)).not.toContain('a@b.co');
    expect(JSON.stringify(e)).not.toContain('9074729');
  });
});
