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
/* ouibounce technique: mouseleave on <html> with the pointer within 20px of the top edge. */
const leaveAt = (page, y) => page.evaluate((cy) => document.documentElement.dispatchEvent(new MouseEvent('mouseleave', { clientY: cy, clientX: 300 })), y);
const exitIntent = (page) => leaveAt(page, 3);
const D = (page) => dialog(page);
const fillForm = async (page, { imo = '9074729', email = 'boss@example.com', marketing = false } = {}) => {
  if (imo !== null) await D(page).locator('input[name=imo]').fill(imo);
  if (email !== null) await D(page).getByLabel('Email', { exact: true }).fill(email);
  if (marketing) await D(page).locator('input[name=marketing]').check();
};
const pickTime = async (page, i = 0) => { const b = D(page).locator('.cp-slotbtn').nth(i); await expect(b).toBeVisible(); await b.click(); return b.getAttribute('data-start'); };
const bookBtn = (page) => D(page).getByRole('button', { name: 'Book this call' });
const bar = (page) => dialog(page).locator('.cp-progress');
const barNow = async (page) => Number(await bar(page).getAttribute('aria-valuenow'));
const bookPosts = (mock) => mock.calls.filter((c) => c.method === 'POST' && c.path === '/api/book');
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
  await leaveAt(page, 300); // leaving through the side/bottom, not near the top edge
  await leaveAt(page, 21);
  await expect(dialog(page)).toHaveCount(0);
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientY: -1, relatedTarget: null }))); // old trigger: no longer used
  await expect(dialog(page)).toHaveCount(0);
  await leaveAt(page, 20); // within 20px: fast movements skip y=0, so this counts
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await page.evaluate(() => localStorage.removeItem('celeste_popup_shown'));
  await page.reload(); await armed(page);
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

test('split layout: image slot left (~40%), decorative eager image with dimensions, form right', async ({ page }) => {
  await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  const fig = dialog(page).locator('[data-image-slot]');
  await expect(fig).toBeVisible();
  const img = fig.locator('img');
  await expect(img).toHaveAttribute('alt', '');
  await expect(img).not.toHaveAttribute('loading', /.+/);
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

test('No thanks closes and counts as dismissed, nothing sent', async ({ page }) => {
  const { events, mock } = await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  await dialog(page).getByRole('button', { name: 'No thanks' }).click();
  await expect(dialog(page)).toBeHidden();
  await expect.poll(() => events.filter((e) => e.event === 'popup_dismissed').length).toBe(1);
  expect(mock.calls.some((c) => c.path === '/api/book/lead')).toBe(false);
});

test('copy slots are marked data-copy-slot, and there is no step text', async ({ page }) => {
  await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  const slots = await dialog(page).locator('[data-copy-slot]').evaluateAll((n) => n.map((e) => e.getAttribute('data-copy-slot')));
  expect(slots).toEqual(expect.arrayContaining(['heading', 'slots-label', 'zone-note', 'imo-hint', 'consent', 'submit']));
  await expect(D(page).locator('[data-copy-slot="heading"]')).toHaveText('Book a 30-minute call');
  await expect(D(page).locator('[data-copy-slot="slots-label"]')).toHaveText('Next free times (your time):');
  await expect(D(page).locator('[data-copy-slot="zone-note"]')).toHaveText('Organiser in Miami (ET)');
  await expect(D(page)).not.toContainText(/step \d/i);
  await expect(D(page)).not.toContainText('We have your details');
  await expect(D(page).locator('a[href^="/book"]')).toHaveCount(0);
  await expect(D(page).locator('.cp-progress')).toHaveAttribute('role', 'progressbar');
});

test('two clicks: pick a time + IMO + email, then Book. Order lead -> book; /api/book never gets the email', async ({ page }) => {
  const { mock, events } = await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  await expect(D(page).locator('.cp-slotbtn')).toHaveCount(3);
  await expect(D(page).getByLabel(/occasional/i)).not.toBeChecked();
  await expect(bookBtn(page)).toBeDisabled();
  const start = await pickTime(page);
  await fillForm(page, { imo: 'IMO 9074729' });
  await expect(bookBtn(page)).toBeEnabled();
  await bookBtn(page).click();
  await expect(D(page).getByRole('heading', { name: /^Booked: .* your time\.$/ })).toBeVisible();
  await expect(D(page)).toContainText('The Teams invite is on its way to boss@example.com.');
  const seq = mock.calls.filter((c) => c.method === 'POST').map((c) => c.path);
  expect(seq).toEqual(['/api/book/lead', '/api/book']);
  const lead = mock.calls.find((c) => c.path === '/api/book/lead').body;
  expect(lead).toMatchObject({ imo: '9074729', role: null, name: null, email: 'boss@example.com', source: 'popup', consent: { marketing: false }, website: '' });
  const sent = bookPosts(mock)[0].body;
  expect(Object.keys(sent).sort()).toEqual(['idempotencyKey', 'leadToken', 'slotStart']);
  expect(sent).toMatchObject({ slotStart: start, leadToken: 'lt_1' });
  expect(JSON.stringify(sent)).not.toContain('boss@example.com');
  expect(await barNow(page)).toBe(100);
  expect(await page.evaluate(() => localStorage.getItem('celeste_lead_submitted'))).toBe('1');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect.poll(() => names(events, 'popup_submit').length).toBe(1);
  expect(names(events, 'popup_dismissed').length).toBe(0);
  const blob = JSON.stringify(events);
  expect(blob).not.toContain('boss@example');
  expect(blob).not.toContain('9074729');
});

test('Book is disabled until a time, a valid IMO and a valid email are all present; nothing is sent meanwhile', async ({ page }) => {
  const { mock } = await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  await expect(D(page).locator('.cp-slotbtn').first()).toBeVisible();
  await fillForm(page);                         // no time yet
  await expect(bookBtn(page)).toBeDisabled();
  await pickTime(page);
  await expect(bookBtn(page)).toBeEnabled();
  await D(page).locator('input[name=imo]').fill('9074728');   // bad check digit
  await expect(bookBtn(page)).toBeDisabled();
  await expect(D(page).locator('.cp-msg')).toContainText('does not look right');
  await D(page).locator('input[name=imo]').fill('9074729');
  await D(page).getByLabel('Email', { exact: true }).fill('not-an-email');
  await expect(bookBtn(page)).toBeDisabled();
  await D(page).getByLabel('Email', { exact: true }).fill('');
  await expect(bookBtn(page)).toBeDisabled();
  expect(mock.calls.filter((c) => c.method === 'POST').length).toBe(0);
});

test('progress bar fills live: 0, 33 time, 66 IMO, 90 email, 100 booked; no step text, valuenow only', async ({ page }) => {
  await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  await expect(D(page).locator('.cp-slotbtn').first()).toBeVisible();
  expect(await barNow(page)).toBe(0);
  await pickTime(page); expect(await barNow(page)).toBe(33);
  await D(page).locator('input[name=imo]').fill('9074729'); expect(await barNow(page)).toBe(66);
  await D(page).getByLabel('Email', { exact: true }).fill('a@example.com'); expect(await barNow(page)).toBe(90);
  expect(Number.parseFloat(await D(page).locator('.cp-progress-fill').evaluate((e) => e.style.width))).toBe(90);
  expect((await bar(page).innerText()).trim()).toBe('');
  await bookBtn(page).click();
  await expect(D(page).getByRole('heading', { name: /^Booked:/ })).toBeVisible();
  expect(await barNow(page)).toBe(100);
});

test('More times expands a compact list inline and a pick from it counts', async ({ page }) => {
  const { mock } = await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  await expect(D(page).locator('.cp-slotbtn').first()).toBeVisible();
  await expect(D(page).locator('.cp-more-box')).toBeHidden();
  await D(page).getByRole('button', { name: /More times/ }).click();
  await expect(D(page).locator('.cp-more-box')).toBeVisible();
  const last = D(page).locator('.cp-more-box .bk-time').last();
  const start = await last.getAttribute('data-start');
  await last.click();
  await fillForm(page);
  await bookBtn(page).click();
  await expect(D(page).getByRole('heading', { name: /^Booked:/ })).toBeVisible();
  expect(bookPosts(mock)[0].body.slotStart).toBe(start);
});

test('slot_taken: the times refresh in place with a plain line; form values survive; second try books', async ({ page }) => {
  const { mock } = await setup(page);
  mock.mode = 'slot_taken';
  await open(page); await armed(page); await exitIntent(page);
  const first = await pickTime(page);
  await fillForm(page);
  await bookBtn(page).click();
  await expect(D(page).locator('.cp-msg')).toHaveText('That time just went. Here are the next ones.');
  await expect(D(page).locator(`[data-start="${first}"]`)).toHaveCount(0);   // taken slot is gone from the refreshed list
  await expect(D(page).locator('input[name=imo]')).toHaveValue('9074729');
  expect(mock.calls.filter((c) => c.path === '/api/book/slots').length).toBe(2);
  mock.mode = 'ok';
  await pickTime(page);
  await expect(bookBtn(page)).toBeEnabled();
  await bookBtn(page).click();
  await expect(D(page).getByRole('heading', { name: /^Booked:/ })).toBeVisible();
  expect(mock.calls.filter((c) => c.path === '/api/book/lead').length).toBe(1);   // the saved lead is reused
});

test('already_booked: calm line, stays on the form', async ({ page }) => {
  const { mock } = await setup(page);
  mock.mode = 'already_booked';
  await open(page); await armed(page); await exitIntent(page);
  await pickTime(page); await fillForm(page); await bookBtn(page).click();
  await expect(D(page).locator('.cp-msg')).toHaveText('You already have a call booked. Check your email.');
  await expect(D(page).getByRole('heading', { name: /^Booked:/ })).toHaveCount(0);
});

test('token_expired: the lead is re-submitted once and the booking retried', async ({ page }) => {
  const { mock } = await setup(page);
  mock.expireTokens = new Set(['lt_1']);
  await open(page); await armed(page); await exitIntent(page);
  await pickTime(page); await fillForm(page); await bookBtn(page).click();
  await expect(D(page).getByRole('heading', { name: /^Booked:/ })).toBeVisible();
  expect(mock.calls.filter((c) => c.path === '/api/book/lead').length).toBe(2);
  expect(bookPosts(mock).map((c) => c.body.leadToken)).toEqual(['lt_1', 'lt_2']);
});

test('in_progress: waits Retry-After, retries with the SAME idempotency key', async ({ page }) => {
  const { mock } = await setup(page);
  mock.inProgressOnce = true;
  await open(page); await armed(page); await exitIntent(page);
  await pickTime(page); await fillForm(page); await bookBtn(page).click();
  await expect(D(page).getByRole('heading', { name: /^Booked:/ })).toBeVisible({ timeout: 8000 });
  const p = bookPosts(mock);
  expect(p.length).toBe(2);
  expect(p[1].body.idempotencyKey).toBe(p[0].body.idempotencyKey);
});

test('other failure: calm line with a mailto, form stays', async ({ page }) => {
  const { mock } = await setup(page);
  mock.mode = 'graph_unavailable';
  await open(page); await armed(page); await exitIntent(page);
  await pickTime(page); await fillForm(page); await bookBtn(page).click();
  await expect(D(page).locator('.cp-msg a[href="mailto:onboarding@celeste7.ai"]')).toBeVisible();
});

test('lead failure: calm line, no booking attempted, flag not set', async ({ page }) => {
  const { mock } = await setup(page);
  mock.leadMode = 'rate_limited';
  await open(page); await armed(page); await exitIntent(page);
  await pickTime(page); await fillForm(page); await bookBtn(page).click();
  await expect(D(page).locator('.cp-msg')).toContainText('did not go through');
  expect(bookPosts(mock).length).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('celeste_lead_submitted'))).toBeNull();
});

test('after booking: optional name + role save through /enrich; then "Thanks."', async ({ page }) => {
  const { mock } = await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  await pickTime(page); await fillForm(page); await bookBtn(page).click();
  await expect(D(page).getByRole('heading', { name: /^Booked:/ })).toBeVisible();
  await expect(D(page).locator('[data-copy-slot="enrich-label"]')).toHaveText('Optional: helps us prepare.');
  await expect(D(page).getByRole('button', { name: /skip/i })).toHaveCount(0);
  await D(page).getByLabel('Your name').fill('Pat Chief');
  await D(page).getByLabel('Your role').selectOption('captain');
  await D(page).getByRole('button', { name: 'Save' }).click();
  await expect(D(page).getByText('Thanks.')).toBeVisible();
  expect(mock.enriched).toEqual({ leadToken: 'lt_1', name: 'Pat Chief', role: 'captain' });
});

test('dryRun booking says it is a test and that nothing was sent', async ({ page }) => {
  const { mock } = await setup(page);
  mock.dryRun = true;
  await open(page); await armed(page); await exitIntent(page);
  await pickTime(page); await fillForm(page); await bookBtn(page).click();
  await expect(D(page).getByRole('heading', { name: 'Test booking only' })).toBeVisible();
  await expect(D(page)).toContainText('nothing was sent');
  await expect(D(page)).not.toContainText('Teams invite is on its way');
});

test('manage link only if https on celeste7.ai', async ({ page }) => {
  const { mock } = await setup(page);
  mock.manageUrl = 'https://evil.example/x';
  await open(page); await armed(page); await exitIntent(page);
  await pickTime(page); await fillForm(page); await bookBtn(page).click();
  await expect(D(page).getByRole('heading', { name: /^Booked:/ })).toBeVisible();
  await expect(D(page).locator('.cp-manage')).toHaveCount(0);
});

test('desktop keeps the photo on the left; phone hides it and stacks IMO over email, no overflow', async ({ page }) => {
  await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  await expect(D(page).locator('[data-image-slot]')).toBeVisible();
  const i = await D(page).locator('input[name=imo]').boundingBox(), e = await D(page).getByLabel('Email', { exact: true }).boundingBox();
  expect(Math.abs(i.y - e.y)).toBeLessThan(4);          // one row on desktop
  await page.keyboard.press('Escape');
  await page.evaluate(() => localStorage.removeItem('celeste_popup_shown'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload(); await armed(page); await exitIntent(page);
  await expect(D(page).locator('[data-image-slot]')).toBeHidden();
  const i2 = await D(page).locator('input[name=imo]').boundingBox(), e2 = await D(page).getByLabel('Email', { exact: true }).boundingBox();
  expect(e2.y).toBeGreaterThan(i2.y + i2.height - 1);   // stacked on phone
  const box = await D(page).boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(390);
});

test('?popup=preview: shows at once, fakes slots, lead, booking and enrich; sends nothing', async ({ page }) => {
  const { mock } = await setup(page, { seed: { celeste_popup_shown: new Date().toISOString(), celeste_lead_submitted: '1' } });
  await open(page, PAGE + '?popup=preview');
  await expect(dialog(page)).toBeVisible({ timeout: 2000 });
  await pickTime(page); await fillForm(page); await bookBtn(page).click();
  await expect(D(page).getByRole('heading', { name: /^Booked:/ })).toBeVisible();
  await D(page).getByLabel('Your name').fill('Rev Iewer');
  await D(page).getByRole('button', { name: 'Save' }).click();
  await expect(D(page).getByText('Thanks.')).toBeVisible();
  expect(mock.calls.length).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('celeste_popup_shown'))).not.toBeNull();
});

test('always light: white card even when the OS prefers dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await setup(page);
  await open(page); await armed(page); await exitIntent(page);
  const c = await dialog(page).evaluate((e) => { const cs = getComputedStyle(e); return [cs.backgroundColor, cs.color, cs.colorScheme]; });
  expect(c[0]).toBe('rgb(255, 255, 255)');
  expect(c[1]).toBe('rgb(20, 17, 15)');
  expect(c[2]).toBe('light');
  expect(await dialog(page).locator('.cp-progress').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(241, 239, 236)');
});

test('without ?popup=preview the popup does not appear on load', async ({ page }) => {
  await setup(page);
  await open(page);
  await page.waitForTimeout(500);
  await expect(dialog(page)).toHaveCount(0);
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
