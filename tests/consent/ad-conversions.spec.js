import { test, expect } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Consent-gated ad tags: Meta Pixel (dataset "CelesteOS Website", 1845508213271128) + Google Ads conversions.
 *  - no request to facebook.net / facebook.com / googleadservices / googletagmanager before consent, after reject,
 *    with analytics only, or under GPC;
 *  - after advertising consent the pixel and gtag load, and booking_click / lead_submit fire Meta "Lead" + a Google
 *    Ads conversion carrying THE SAME event_id the first-party collector receives (Meta eventID, Google
 *    transaction_id), so a server-side Conversions API copy is de-duplicated;
 *  - the collector payload carries fbp / fbc / gclid only with advertising consent.
 * Hermetic: local static server, every off-origin request recorded and stubbed (fbevents.js / gtag.js return an
 * empty script, so fbq.queue and dataLayer keep every call for inspection).
 * Run: npx playwright test tests/consent/ad-conversions.spec.js --project=chromium
 */

const ROOT = path.resolve(__dirname, '../..');
const BOOKING_SEL = 'a[href^="https://outlook.office.com/book/"], a[href^="https://bookings.cloud.microsoft/book/"]';
const COLLECTOR = 'https://control.celeste7.ai/api/collect/web';
const AD_HOSTS = /facebook\.(net|com)|googleadservices\.com|googletagmanager\.com|doubleclick\.net/i;
const PIXEL_ID = '1845508213271128';
const GADS_BOOKING = 'AW-17947526022/DpOzCPrEma8dEIaHhu5C';
const GADS_LEAD = 'AW-17947526022/yLTgCJ-m7_YbEIaHhu5C';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
const LANDING = '/index.html?utm_source=facebook&utm_medium=paid&fbclid=TESTFBCLID&gclid=TESTGCLID';

let server, base;
test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { await new Promise((r) => server.close(r)); });

async function instrument(page, { gpc = false } = {}) {
  const hits = [], sent = [];
  if (gpc) await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true, configurable: true }));
  await page.context().route('**/*', (route) => {
    const req = route.request();
    const url = req.url();
    if (url.startsWith(base)) return route.continue();
    if (url === COLLECTOR) {
      try { sent.push(JSON.parse(req.postData() || '{}')); } catch { sent.push({ unparsable: true }); }
      return route.fulfill({ status: 202, contentType: 'application/json', body: '{"received":true}' });
    }
    if (AD_HOSTS.test(url)) hits.push(url);
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
  });
  return { hits, sent };
}
const settle = (page) => page.waitForTimeout(500);
const fbqCalls = (page) => page.evaluate(() => (window.fbq && window.fbq.queue ? window.fbq.queue.map((a) => JSON.parse(JSON.stringify(Array.from(a)))) : null));
const conversions = (page) => page.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)).filter((a) => a[0] === 'event' && a[1] === 'conversion').map((a) => a[2]));
const leads = async (page) => ((await fbqCalls(page)) || []).filter((a) => a[0] === 'track' && a[1] === 'Lead');
async function clickBooking(page) {
  const a = page.locator(BOOKING_SEL).first();
  await a.evaluate((el) => { el.target = ''; el.addEventListener('click', (e) => e.preventDefault()); });
  await a.click();
  await settle(page);
}
async function submitLead(page) {
  await page.fill('#lm-vessel', 'M/Y Test');
  for (const inp of await page.locator('#lm-entries input').all()) await inp.fill('job done');
  await page.fill('#lm-email', 'captain@example.invalid');
  await page.locator('#magnet-form').evaluate((f) => f.requestSubmit());
  await settle(page);
}

test.describe('Ad tags (Meta Pixel + Google Ads), consent-gated', () => {
  test('before consent: no ad/tag host requested, no fbq, no conversion, even on booking click and lead submit', async ({ page }) => {
    const { hits, sent } = await instrument(page);
    await page.goto(base + LANDING); await settle(page);
    await expect(page.locator('.cc-banner')).toBeVisible();
    await clickBooking(page);
    await submitLead(page);
    expect(hits).toEqual([]);
    expect(sent).toEqual([]);
    expect(await fbqCalls(page)).toBeNull();
    expect(await conversions(page)).toEqual([]);
    expect((await page.context().cookies()).map((c) => c.name).filter((n) => /^_(fbp|fbc|gcl)/.test(n))).toEqual([]);
  });

  test('reject all: nothing loads now or after reload', async ({ page }) => {
    const { hits } = await instrument(page);
    await page.goto(base + LANDING);
    await page.click('.cc-banner [data-cc="reject"]'); await settle(page);
    await clickBooking(page);
    await page.reload(); await settle(page);
    expect(hits).toEqual([]);
    expect(await fbqCalls(page)).toBeNull();
    expect(await conversions(page)).toEqual([]);
  });

  test('analytics only: collector gets events without fbp/fbc, no pixel, no Ads conversion', async ({ page }) => {
    const { hits, sent } = await instrument(page);
    await page.goto(base + LANDING);
    await page.click('.cc-banner [data-cc="manage"]');
    await page.check('#cc-analytics');
    await page.click('.cc-panel [data-cc="save"]'); await settle(page);
    await page.evaluate(() => { document.cookie = '_fbp=fb.1.1700000000000.123456789; path=/'; });
    await clickBooking(page);
    expect(hits.filter((u) => /facebook|googleadservices|AW-/.test(u))).toEqual([]);
    expect(await fbqCalls(page)).toBeNull();
    expect(await conversions(page)).toEqual([]);
    const click = sent.find((e) => e.event === 'booking_click');
    expect(click).toBeTruthy();
    expect(click.consent).toEqual({ analytics: true, ads: false });
    expect(click.fbp).toBeUndefined();
    expect(click.fbc).toBeUndefined();
  });

  test('accept all: pixel + gtag load after consent; booking_click fires Lead + Ads conversion with the collector event_id', async ({ page }) => {
    const { hits, sent } = await instrument(page);
    await page.goto(base + LANDING); await settle(page);
    expect(hits).toEqual([]);                                   // nothing before the click on Accept
    await page.click('.cc-banner [data-cc="accept"]'); await settle(page);
    expect(hits.some((u) => u.startsWith('https://connect.facebook.net/en_US/fbevents.js'))).toBe(true);
    expect(hits.some((u) => /googletagmanager\.com\/gtag\/js/.test(u))).toBe(true);
    const calls = await fbqCalls(page);
    expect(calls).toContainEqual(['set', 'autoConfig', false, PIXEL_ID]);
    expect(calls).toContainEqual(['init', PIXEL_ID]);
    expect(calls).toContainEqual(['track', 'PageView']);
    expect(await leads(page)).toEqual([]);                      // landing is not a lead

    await page.evaluate(() => { document.cookie = '_fbp=fb.1.1700000000000.123456789; path=/'; });
    await clickBooking(page);
    const click = sent.find((e) => e.event === 'booking_click');
    expect(click).toMatchObject({ consent: { analytics: true, ads: true }, fbp: 'fb.1.1700000000000.123456789', gclid: 'TESTGCLID' });
    expect(click.fbc).toMatch(/^fb\.1\.\d+\.TESTFBCLID$/);
    expect(click.event_id).toMatch(/^[0-9a-f-]{36}$/);
    const [lead] = await leads(page);
    expect(lead).toEqual(['track', 'Lead', { content_name: 'demo_booking', content_category: 'demo' }, { eventID: click.event_id }]);
    expect(await conversions(page)).toEqual([{ send_to: GADS_BOOKING, value: 1, currency: 'USD', transaction_id: click.event_id }]);
  });

  test('accept all: lead_submit fires Lead + "Submit lead form" conversion with the collector event_id', async ({ page }) => {
    const { sent } = await instrument(page);
    await page.goto(base + LANDING);
    await page.click('.cc-banner [data-cc="accept"]'); await settle(page);
    await submitLead(page);
    const ev = sent.find((e) => e.event === 'lead_submit');
    expect(ev).toBeTruthy();
    const [lead] = await leads(page);
    expect(lead).toEqual(['track', 'Lead', { content_name: 'lead_form', content_category: 'demo' }, { eventID: ev.event_id }]);
    expect(JSON.stringify(lead)).not.toContain('captain@');     // no form contents to Meta from the browser
    expect(await conversions(page)).toEqual([{ send_to: GADS_LEAD, value: 1, currency: 'USD', transaction_id: ev.event_id }]);
  });

  test('stored consent on a later page: pixel loads at boot, gclid comes from the _gcl_aw cookie', async ({ page }) => {
    const { hits, sent } = await instrument(page);
    await page.goto(base + LANDING);
    await page.click('.cc-banner [data-cc="accept"]'); await settle(page);
    await page.evaluate(() => { document.cookie = '_gcl_aw=GCL.1700000000.COOKIEGCLID; path=/'; });
    hits.length = 0; sent.length = 0;
    await page.goto(base + '/index.html'); await settle(page);
    expect(hits.some((u) => /fbevents\.js/.test(u))).toBe(true);
    await clickBooking(page);
    expect(sent.find((e) => e.event === 'booking_click')).toMatchObject({ gclid: 'COOKIEGCLID' });
  });

  test('advertising only: pixel Lead fires, collector receives nothing', async ({ page }) => {
    const { hits, sent } = await instrument(page);
    await page.goto(base + LANDING);
    await page.click('.cc-banner [data-cc="manage"]');
    await page.check('#cc-ads');
    await page.click('.cc-panel [data-cc="save"]'); await settle(page);
    await clickBooking(page);
    expect(hits.some((u) => /fbevents\.js/.test(u))).toBe(true);
    expect(sent).toEqual([]);
    const [lead] = await leads(page);
    expect(lead[3].eventID).toMatch(/^[0-9a-f-]{36}$/);
    expect((await conversions(page))[0]).toMatchObject({ send_to: GADS_BOOKING, transaction_id: lead[3].eventID });
  });

  test('GPC + accept all: no pixel, no Ads conversion, no fbp/fbc to the collector', async ({ page }) => {
    const { hits, sent } = await instrument(page, { gpc: true });
    await page.goto(base + LANDING);
    await page.click('.cc-banner [data-cc="accept"]'); await settle(page);
    await page.evaluate(() => { document.cookie = '_fbp=fb.1.1700000000000.123456789; path=/'; });
    await clickBooking(page);
    expect(hits.filter((u) => /facebook|googleadservices|AW-/.test(u))).toEqual([]);
    expect(await fbqCalls(page)).toBeNull();
    expect(await conversions(page)).toEqual([]);
    const click = sent.find((e) => e.event === 'booking_click');
    expect(click.consent.ads).toBe(false);
    expect(click.fbp).toBeUndefined();
  });

  test('withdrawing advertising deletes _fbp/_fbc and nothing loads again', async ({ page }) => {
    const { hits } = await instrument(page);
    await page.goto(base + LANDING);
    await page.click('.cc-banner [data-cc="accept"]'); await settle(page);
    await page.evaluate(() => { document.cookie = '_fbp=fb.1.1.2; path=/'; document.cookie = '_fbc=fb.1.1.X; path=/'; document.cookie = 'keep_me=1; path=/'; });
    await page.locator('[data-privacy-choices]').first().click();
    await Promise.all([page.waitForEvent('load'), page.click('.cc-panel [data-cc="reject"]')]);
    await settle(page);
    const names = (await page.context().cookies()).map((c) => c.name);
    expect(names).not.toContain('_fbp');
    expect(names).not.toContain('_fbc');
    expect(names).toContain('keep_me');
    hits.length = 0;
    await page.goto(base + '/about.html'); await settle(page);
    expect(hits).toEqual([]);
  });

  test('a choice stored under the previous consent version (before the Meta Pixel) re-prompts and loads nothing', async ({ page }) => {
    const { hits } = await instrument(page);
    await page.addInitScript(() => localStorage.setItem('celeste_consent', JSON.stringify({ v: '2026-10-15', analytics: true, ads: true })));
    await page.goto(base + '/index.html'); await settle(page);
    await expect(page.locator('.cc-banner')).toBeVisible();
    expect(hits).toEqual([]);
  });
});
