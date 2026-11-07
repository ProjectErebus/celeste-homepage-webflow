/* /book and /book/manage against a mock of booking-api-contract.md v1. Self-contained: starts its own static
 * server (cleanUrls-style) and intercepts the API, so it ignores TEST_URL and needs no network for the API. */
import { test, expect } from '@playwright/test';
import { startServer } from './static-server.mjs';
import { createMock, API, captureCollector, consentJson, CONSENT_KEY } from './mock-api.mjs';

let srv;
test.beforeAll(async () => { srv = await startServer(); });
test.afterAll(async () => { await new Promise((r) => srv.server.close(r)); });

test.use({ locale: 'en-GB', timezoneId: 'Europe/Paris' });

async function open(page, mock, path = '/book', extra = '') {
  await mock.install(page);
  await mock.installImo(page, srv.url);
  await page.addInitScript(() => { try { localStorage.setItem('celeste_consent_dummy', '1'); } catch (e) {} });
  await page.goto(`${srv.url}${path}${path.includes('?') ? '&' : '?'}api=${encodeURIComponent(API)}${extra}`);
}
const posts = (mock) => mock.calls.filter((c) => c.method === 'POST' && c.path === '/api/book');

async function lead(page, over = {}) {
  await page.getByLabel(/Vessel IMO/).fill(over.imo ?? '9074729');
  await page.getByLabel('Your role').selectOption(over.role ?? 'chief_engineer');
  await page.getByLabel('Name', { exact: true }).fill(over.name ?? 'Test Chief');
  await page.getByLabel('Email', { exact: true }).fill(over.email ?? 'chief@example.com');
  if (over.marketing) await page.getByLabel(/Send me occasional/).check();
  await page.getByRole('button', { name: 'Choose a time' }).click();
}
async function pickFirstSlot(page) {
  const btn = page.locator('.bk-time').first();
  await expect(btn).toBeVisible();
  const start = await btn.getAttribute('data-start');
  await btn.click();
  return start;
}
const confirmBtn = (page) => page.getByRole('button', { name: 'Confirm booking' });
/* form-first: lead -> slot -> (confirm click by the caller) */
async function toConfirm(page, over = {}) { await lead(page, over); return pickFirstSlot(page); }

test('page is noindex and slots render in Eastern Time (not the visitor zone) with an ET zone line', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
  await lead(page);
  const first = mock.slots[0];
  const expected = new Date(first.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });
  const paris = new Date(first.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  expect(expected).not.toBe(paris);   // the visitor is in Paris: the check can tell the zones apart
  await expect(page.locator('.bk-time').first()).toHaveText(expected);
  await expect(page.locator('#bk-zone')).toContainText('All times are Eastern Time (ET).');
  await expect(page.locator('#bk-zone')).not.toContainText('Europe/Paris');
  expect(mock.calls.find((c) => c.path === '/api/book/slots').search).toContain('days=14');
});

test('happy path: lead -> slot -> confirm', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await expect(page.locator('#bk-step1')).toBeVisible();
  await lead(page, { imo: '9074729' });
  await expect(page.locator('#bk-step2')).toBeVisible();
  const start = await pickFirstSlot(page);
  await expect(page.locator('#bk-step3')).toBeVisible();
  await expect(page.locator('#bk-chosen')).toContainText(/ ET, 25 minutes$/);
  expect(mock.calls.filter((c) => c.path === '/api/book').length).toBe(0); // nothing booked until Confirm
  await confirmBtn(page).click();
  await expect(page.locator('#bk-invite')).toHaveText('The Teams invite is on its way to chief@example.com.');
  await expect(page.getByRole('link', { name: 'Join the Teams meeting' })).toHaveAttribute('href', /teams\.microsoft\.com/);
  const l = mock.calls.find((c) => c.path === '/api/book/lead').body;
  expect(l).toMatchObject({ imo: '9074729', role: 'chief_engineer', name: 'Test Chief', email: 'chief@example.com', source: 'book', consent: { marketing: false }, website: '' });
  expect(l.utm).toHaveProperty('source');
  expect(l).toHaveProperty('anonId');
  const sent = posts(mock)[0].body;
  expect(Object.keys(sent).sort()).toEqual(['idempotencyKey', 'leadToken', 'slotStart']);
  expect(sent).toMatchObject({ slotStart: start, leadToken: 'lt_1' });
  expect(sent.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
});

test('company, vessel and notes fields are gone from the form', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await expect(page.getByLabel('Company')).toHaveCount(0);
  await expect(page.getByLabel(/Anything we should know/)).toHaveCount(0);
  await expect(page.locator('input[name=vessel], textarea[name=notes]')).toHaveCount(0);
  await expect(page.locator('#bk-imo')).toBeVisible();
  await expect(page.getByLabel('Your role').locator('option')).toHaveText(['Choose a role', 'Chief engineer', 'ETO', 'Captain', 'Manager', 'Owner', 'Other']);
});

test('IMO check digit: valid passes, invalid is rejected client-side with no lead sent', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  const r = await page.evaluate(() => ['9074729', 'IMO 9074729', 'imo9074729', ' 9074729 ', '9074728', '907472', '90747291', 'abcdefg', '9074720'].map((v) => window.celesteBookImo.valid(v)));
  expect(r).toEqual([true, true, true, true, false, false, false, false, false]);
  await page.getByLabel(/Vessel IMO/).fill('9074728');
  await expect(page.locator('#bk-imo-note')).toContainText('does not look right');
  await page.getByLabel('Your role').selectOption('captain');
  await page.getByLabel('Name', { exact: true }).fill('A B');
  await page.getByLabel('Email', { exact: true }).fill('a@b.co');
  await page.getByRole('button', { name: 'Choose a time' }).click();
  await expect(page.locator('#bk-status')).toContainText('does not look right');
  await expect(page.locator('#bk-step1')).toBeVisible();
  expect(mock.calls.some((c) => c.path === '/api/book/lead')).toBe(false);
  expect(mock.calls.some((c) => c.path === '/api/imo-lookup')).toBe(false);
});

test('IMO is required on /book: empty IMO blocks the lead with a clear message', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await expect(page.locator('#bk-imo')).toHaveAttribute('required', '');
  await page.getByLabel('Your role').selectOption('captain');
  await page.getByLabel('Name', { exact: true }).fill('A B');
  await page.getByLabel('Email', { exact: true }).fill('a@b.co');
  await page.getByRole('button', { name: 'Choose a time' }).click();
  await expect(page.locator('#bk-status')).toContainText('7-digit IMO');
  await expect(page.locator('#bk-imo')).toBeFocused();
  await expect(page.locator('#bk-step1')).toBeVisible();
  expect(mock.calls.some((c) => c.path === '/api/book/lead')).toBe(false);
});

test('valid IMO: vessel confirm line shown (name, length, flag); IMO prefix stripped in the lookup', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  // pasted with its prefix into the 7-character box: only the digits stay
  await page.getByLabel(/Vessel IMO/).evaluate((i) => { const dt = new DataTransfer(); dt.setData('text', 'IMO 9074729'); i.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); });
  await expect(page.getByLabel(/Vessel IMO/)).toHaveValue('9074729');
  await expect(page.locator('#bk-imo-note')).toHaveText('M/Y Test Star \u00b7 42 m \u00b7 Cayman Islands. Is this your vessel?');
  const call = mock.calls.find((c) => c.path === '/api/imo-lookup');
  expect(call.method).toBe('POST');
  expect(call.body).toEqual({ imo: '9074729' });
});

for (const vesselMode of ['not_found', 'disabled', 'rate_limited', 'bad_request', 'fail']) {
  test(`vessel lookup ${vesselMode}: silent, typed IMO kept and sent`, async ({ page }) => {
    const mock = createMock({ vesselMode });
    await open(page, mock);
    await page.getByLabel(/Vessel IMO/).fill('9074729');
    await expect.poll(() => mock.calls.some((c) => c.path === '/api/imo-lookup')).toBe(true);
    await page.waitForTimeout(150);
    await expect(page.locator('#bk-imo-note')).toHaveText('');
    await expect(page.locator('#bk-status')).toHaveText('');
    await lead(page);
    await expect(page.locator('#bk-step2')).toBeVisible();
    expect(mock.calls.find((c) => c.path === '/api/book/lead').body.imo).toBe('9074729');
  });
}

test('vessel text from the API is rendered as text, not HTML', async ({ page }) => {
  const mock = createMock();
  mock.vessel = { ...mock.vessel, name: '<img src=x onerror=window.__x=1>', flag: null, length_m: null };
  await open(page, mock);
  await page.getByLabel(/Vessel IMO/).fill('9074729');
  await expect(page.locator('#bk-imo-note')).toContainText('<img src=x');
  expect(await page.evaluate(() => window.__x)).toBeUndefined();
});

test('lookup is same-origin: the ?api= override is not used for it, and no MMSI/position is rendered', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await page.getByLabel(/Vessel IMO/).fill('9074729');
  await expect(page.locator('#bk-imo-note')).toContainText('Test Star');
  expect(mock.calls.some((c) => c.path === '/api/vessel')).toBe(false);
  const txt = await page.locator('#bk-step1').innerText();
  expect(txt).not.toMatch(/mmsi|latitude|longitude|position/i);
});

test('null fields show as unknown, never blank or 0', async ({ page }) => {
  const mock = createMock();
  mock.vessel = { ...mock.vessel, length_m: null, flag: null, gross_tonnage: null };
  await open(page, mock);
  await page.getByLabel(/Vessel IMO/).fill('9074729');
  await expect(page.locator('#bk-imo-note')).toHaveText('M/Y Test Star \u00b7 length unknown \u00b7 flag unknown. Is this your vessel?');
});

test('name_mismatch: vessel shown with "Is this yours?"', async ({ page }) => {
  const mock = createMock({ vesselMode: 'name_mismatch' });
  await open(page, mock);
  await page.getByLabel(/Vessel IMO/).fill('9074729');
  await expect(page.locator('#bk-imo-note')).toHaveText('M/Y Test Star \u00b7 42 m \u00b7 Cayman Islands. Is this yours?');
});

test('ambiguous: visitor picks one of the candidates', async ({ page }) => {
  const mock = createMock({ vesselMode: 'ambiguous' });
  await open(page, mock);
  await page.getByLabel(/Vessel IMO/).fill('9074729');
  await expect(page.locator('.bk-cand')).toHaveCount(2);
  await page.locator('.bk-cand').nth(1).click();
  await expect(page.locator('#bk-imo-note')).toContainText('M/Y Test Moon \u00b7 length unknown \u00b7 flag unknown');
  await expect(page.locator('.bk-cand')).toHaveCount(0);
  await lead(page);
  await expect(page.locator('#bk-step2')).toBeVisible();
});

test('over_limit (500+ GT): copy-slot line shown, lead is NOT blocked', async ({ page }) => {
  const mock = createMock({ vesselMode: 'over_limit' });
  await open(page, mock);
  await page.getByLabel(/Vessel IMO/).fill('9074729');
  const gt = page.locator('#bk-imo-gt');
  await expect(gt).toBeVisible();
  await expect(gt).toHaveAttribute('data-copy-slot', 'gt-over-limit');
  await expect(gt).toHaveText("Our records show 812 GT. Tell us if that's wrong.");
  await lead(page);
  await expect(page.locator('#bk-step2')).toBeVisible();
  expect(mock.calls.find((c) => c.path === '/api/book/lead').body.imo).toBe('9074729');
});

test('lead error: calm message, stays on step 1', async ({ page }) => {
  const mock = createMock({ leadMode: 'booking_disabled' });
  await open(page, mock);
  await lead(page);
  await expect(page.locator('#bk-status')).toContainText('not available just now');
  await expect(page.locator('#bk-step1')).toBeVisible();
});

test('marketing consent is sent only when ticked, default unticked (on the lead)', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await expect(page.getByLabel(/Send me occasional/)).not.toBeChecked();
  await lead(page, { marketing: true });
  await pickFirstSlot(page);
  await confirmBtn(page).click();
  await expect(page.locator('#bk-done')).toBeVisible();
  expect(mock.calls.find((c) => c.path === '/api/book/lead').body.consent.marketing).toBe(true);
});

test('slot_taken: says the time just went and re-fetches slots', async ({ page }) => {
  const mock = createMock({ mode: 'slot_taken' });
  await open(page, mock);
  const start = await toConfirm(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-status')).toContainText('just taken');
  await expect(page.locator('#bk-step2')).toBeVisible();
  const slotCalls = mock.calls.filter((c) => c.path === '/api/book/slots');
  expect(slotCalls.length).toBe(2);
  await expect(page.locator(`.bk-time[data-start="${start}"]`)).toHaveCount(0);
});

test('booking_disabled on POST: calm message plus mailto fallback', async ({ page }) => {
  const mock = createMock({ mode: 'booking_disabled' });
  await open(page, mock);
  await toConfirm(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-status')).toContainText('not available just now');
  await expect(page.locator('#bk-status a')).toHaveAttribute('href', 'mailto:onboarding@celeste7.ai');
});

test('booking_disabled on slots GET: message plus mailto, no slot buttons', async ({ page }) => {
  const mock = createMock({ slotsMode: 'booking_disabled' });
  await open(page, mock);
  await lead(page);
  await expect(page.locator('#bk-status a')).toHaveAttribute('href', 'mailto:onboarding@celeste7.ai');
  await expect(page.locator('.bk-time')).toHaveCount(0);
});

test('rate_limited shows calm message plus mailto', async ({ page }) => {
  const mock = createMock({ mode: 'rate_limited' });
  await open(page, mock);
  await toConfirm(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-status')).toContainText('wait a little');
  await expect(page.locator('#bk-status a')).toHaveAttribute('href', 'mailto:onboarding@celeste7.ai');
});

test('honeypot website field is hidden from users and sent empty on the lead', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await expect(page.locator('#bk-website')).not.toBeInViewport();
  await toConfirm(page);
  await confirmBtn(page).click();
  await expect(page.locator('#bk-done')).toBeVisible();
  expect(mock.calls.find((c) => c.path === '/api/book/lead').body.website).toBe('');
});

test('slot buttons are keyboard operable', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await lead(page);
  const btn = page.locator('.bk-time').first();
  await btn.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#bk-step3')).toBeVisible();
  await expect(page.locator('#bk-step3')).toBeFocused();
});

test('phone viewport 390px: no horizontal scroll, full flow works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const mock = createMock();
  await open(page, mock);
  const overflow1 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow1).toBeLessThanOrEqual(0);
  await toConfirm(page);
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
  await toConfirm(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-done')).toBeVisible();
  expect(evil.calls.length).toBe(0);
  expect(prod.calls.some((c) => c.path === '/api/book' && c.method === 'POST')).toBe(true);
});

test('javascript: joinUrl and off-site / http manageUrl are not rendered', async ({ page }) => {
  const mock = createMock();
  mock.joinUrl = 'javascript:void(window.__pwned=1)';
  mock.manageUrl = 'https://evil.example/book/manage?id=x&t=y';
  await open(page, mock);
  await toConfirm(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-done')).toBeVisible();
  await expect(page.locator('#bk-join')).toBeHidden();
  await expect(page.locator('#bk-manage')).toBeHidden();
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
});

test('valid https join link and celeste7.ai manage link are rendered', async ({ page }) => {
  const mock = createMock();
  await open(page, mock);
  await toConfirm(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-join')).toBeVisible();
  await expect(page.locator('#bk-manage')).toBeVisible();
});

test('retry after a lost response reuses the idempotency key; changed data gets a new key', async ({ page }) => {
  const mock = createMock();
  mock.dropFirstResponse = true;
  await open(page, mock);
  await toConfirm(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-status')).toContainText('Something went wrong');
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-done')).toBeVisible();
  const p = posts(mock);
  expect(p.length).toBe(2);
  expect(p[1].body.idempotencyKey).toBe(p[0].body.idempotencyKey);
});

test('picking a different slot between attempts generates a new idempotency key', async ({ page }) => {
  const mock = createMock({ mode: 'rate_limited' });
  await open(page, mock);
  await toConfirm(page);
  await confirmBtn(page).click();
  await expect(page.locator('#bk-status')).toContainText('wait a little');
  await page.getByRole('button', { name: 'Choose another time' }).click();
  await page.locator('.bk-time').nth(1).click();
  await confirmBtn(page).click();
  await expect(page.locator('#bk-status')).toContainText('wait a little');
  const p = posts(mock);
  expect(p[1].body.slotStart).not.toBe(p[0].body.slotStart);
  expect(p[1].body.idempotencyKey).not.toBe(p[0].body.idempotencyKey);
});

test('token_expired: lead is re-submitted silently from memory and the booking retried once', async ({ page }) => {
  const mock = createMock();
  mock.expireTokens = new Set(['lt_1']);
  await open(page, mock);
  await toConfirm(page, { imo: '9074729', name: 'Test Chief' });
  await confirmBtn(page).click();
  await expect(page.locator('#bk-done')).toBeVisible();
  const leads = mock.calls.filter((c) => c.path === '/api/book/lead');
  expect(leads.length).toBe(2);
  expect(leads[1].body).toEqual(leads[0].body);
  const p = posts(mock);
  expect(p.length).toBe(2);
  expect(p[0].body.leadToken).toBe('lt_1');
  expect(p[1].body.leadToken).toBe('lt_2');
  expect(p[1].body.slotStart).toBe(p[0].body.slotStart);
  await expect(page.locator('#bk-invite')).toContainText('chief@example.com');
});

test('token_expired twice: no loop, calm message after one retry', async ({ page }) => {
  const mock = createMock();
  mock.expireTokens = new Set(['lt_1', 'lt_2', 'lt_3']);
  await open(page, mock);
  await toConfirm(page);
  await confirmBtn(page).click();
  await expect(page.locator('#bk-status')).toContainText('could not use your details');
  expect(posts(mock).length).toBe(2);
  expect(mock.calls.filter((c) => c.path === '/api/book/lead').length).toBe(2);
});

test('bad_token: calm message, no silent re-submit', async ({ page }) => {
  const mock = createMock();
  mock.badToken = true;
  await open(page, mock);
  await toConfirm(page);
  await confirmBtn(page).click();
  await expect(page.locator('#bk-status')).toContainText('could not use your details');
  expect(mock.calls.filter((c) => c.path === '/api/book/lead').length).toBe(1);
});

test('dryRun response says test booking, no invite, no join link', async ({ page }) => {
  const mock = createMock();
  mock.dryRun = true;
  await open(page, mock);
  await toConfirm(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.locator('#bk-invite')).toContainText('test booking');
  await expect(page.locator('#bk-invite')).toContainText('no invite has been sent');
  await expect(page.locator('#bk-invite')).not.toContainText('on its way');
  await expect(page.locator('#bk-join')).toBeHidden();
});

/* ---- tracking events (consent-gated, no PII) ---- */
async function openTracked(page, mock, analytics) {
  const events = await captureCollector(page);
  await page.addInitScript(([k, v]) => { try { if (v) localStorage.setItem(k, v); } catch (e) {} }, [CONSENT_KEY, analytics === null ? null : consentJson(analytics)]);
  await open(page, mock);
  return events;
}
const evs = (events, n) => events.filter((e) => e.event === n);

test('tracking: book_step lead -> slot -> confirm and imo_resolved fire with analytics consent, no PII', async ({ page }) => {
  const mock = createMock();
  const events = await openTracked(page, mock, true);
  await page.getByLabel(/Vessel IMO/).fill('9074729');
  await expect.poll(() => evs(events, 'imo_resolved').length).toBe(1);
  await lead(page, { imo: '9074729', email: 'private.person@example.com', name: 'Private Person' });
  await pickFirstSlot(page);
  await expect.poll(() => evs(events, 'book_step').map((e) => e.step)).toEqual(['lead', 'slot', 'confirm']);
  expect(evs(events, 'imo_resolved')[0].found).toBe(true);
  const blob = JSON.stringify(events.filter((e) => e.event === 'book_step' || e.event === 'imo_resolved'));
  for (const pii of ['private.person', 'Private Person', '9074729', 'Test Star']) expect(blob).not.toContain(pii);
});

test('tracking: imo_resolved found=false on 404, nothing on 503', async ({ page }) => {
  const mock = createMock({ vesselMode: 'not_found' });
  const events = await openTracked(page, mock, true);
  await page.getByLabel(/Vessel IMO/).fill('9074729');
  await expect.poll(() => evs(events, 'imo_resolved').length).toBe(1);
  expect(evs(events, 'imo_resolved')[0].found).toBe(false);
  mock.vesselMode = 'disabled';
  await page.getByLabel(/Vessel IMO/).fill('');
  await page.getByLabel(/Vessel IMO/).fill('9074729');
  await page.waitForTimeout(300);
  expect(evs(events, 'imo_resolved').length).toBe(1);
});

for (const [label, analytics] of [['no consent choice made', null], ['analytics declined', false]]) {
  test(`tracking: no events at all when ${label}`, async ({ page }) => {
    const mock = createMock();
    const events = await openTracked(page, mock, analytics);
    await page.getByLabel(/Vessel IMO/).fill('9074729');
    await expect(page.locator('#bk-imo-note')).toContainText('Test Star');
    await lead(page);
    await pickFirstSlot(page);
    await page.waitForTimeout(400);
    expect(events.filter((e) => ['book_step', 'imo_resolved'].includes(e.event)).length).toBe(0);
    expect(events.length).toBe(0);
  });
}
