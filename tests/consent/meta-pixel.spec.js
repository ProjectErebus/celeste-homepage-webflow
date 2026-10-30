import { test, expect } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Meta Pixel (dataset 1845508213271128) in js/cookie-consent.js: loaded only after ADVERTISING consent, never under
 * GPC, advanced matching off; Lead / Schedule fire with eventID = the collector event_id (dedupe with the Conversions
 * API copy); withdrawal revokes and deletes _fbp / _fbc.
 * Hermetic: local static server; fbevents.js is stubbed (empty), so the fbq queue shows exactly what the page asked for.
 * Run: npx playwright test tests/consent/meta-pixel.spec.js --project=chromium
 */

const ROOT = path.resolve(__dirname, '../..');
const PIXEL = '1845508213271128';
const FB = /connect\.facebook\.net|facebook\.com\/tr/i;
const COLLECTOR = 'https://control.celeste7.ai/api/collect/web';
const BOOKING_SEL = 'a[href^="https://outlook.office.com/book/"], a[href^="https://bookings.cloud.microsoft/book/"]';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };

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
  const fb = [], sent = [];
  if (gpc) await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true, configurable: true }));
  await page.context().route('**/*', (route) => {
    const req = route.request();
    const url = req.url();
    if (url.startsWith(base)) return route.continue();
    if (FB.test(url)) fb.push(url);
    if (url === COLLECTOR) {
      try { sent.push(JSON.parse(req.postData() || '{}')); } catch { sent.push({}); }
      return route.fulfill({ status: 202, contentType: 'application/json', body: '{"received":true}' });
    }
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
  });
  return { fb, sent };
}
const settle = (page) => page.waitForTimeout(500);
const fbqQueue = (page) => page.evaluate(() => (window.fbq && window.fbq.queue ? window.fbq.queue.map((a) => JSON.parse(JSON.stringify(Array.from(a)))) : null));
const LANDING = '/index.html?utm_source=facebook&utm_medium=paid&fbclid=IwAR0testfbclid';

async function submitLead(page, email) {
  await page.fill('#lm-vessel', 'M/Y Test');
  for (const inp of await page.locator('#lm-entries input').all()) await inp.fill('job done');
  await page.fill('#lm-email', email);
  await page.locator('#magnet-form').evaluate((f) => f.requestSubmit());
  await settle(page);
}

test.describe('Meta Pixel', () => {
  test('nothing from Meta before consent, after reject, or with analytics only', async ({ page }) => {
    const { fb } = await instrument(page);
    await page.goto(base + LANDING); await settle(page);
    expect(fb).toEqual([]);
    expect(await page.evaluate(() => typeof window.fbq)).toBe('undefined');
    await page.locator('.cc-banner [data-cc="manage"]').click();
    await page.check('#cc-analytics');
    await page.uncheck('#cc-ads');
    await page.click('.cc-panel [data-cc="save"]'); await settle(page);
    await submitLead(page, 'captain@example.com');
    expect(fb).toEqual([]);
    expect(await page.evaluate(() => typeof window.fbq)).toBe('undefined');
  });

  test('accept: Pixel loads, no advanced matching; Lead and Schedule carry the collector event_id', async ({ page }) => {
    const { fb, sent } = await instrument(page);
    await page.goto(base + LANDING); await settle(page);
    expect(fb).toEqual([]);
    await page.click('.cc-banner [data-cc="accept"]'); await settle(page);
    expect(fb.some((u) => /connect\.facebook\.net\/en_US\/fbevents\.js/.test(u))).toBe(true);
    let q = await fbqQueue(page);
    expect(q).toContainEqual(['set', 'autoConfig', false, PIXEL]);
    expect(q.filter((a) => a[0] === 'init')).toEqual([['init', PIXEL]]); // no user data object => no advanced matching
    expect(q).toContainEqual(['track', 'PageView']);

    await page.evaluate(() => { document.cookie = '_fbp=fb.1.1793350000000.1234567890; path=/'; });
    await submitLead(page, 'captain@example.com');
    const lead = sent.find((e) => e.event === 'lead_submit');
    expect(lead).toBeTruthy();
    expect(lead).toMatchObject({ consent: { analytics: true, ads: true }, fbp: 'fb.1.1793350000000.1234567890' });
    q = await fbqQueue(page);
    expect(q).toContainEqual(['track', 'Lead', {}, { eventID: lead.event_id }]);
    // The Pixel never receives form contents.
    expect(JSON.stringify(q)).not.toContain('captain@example.com');

    await page.goto(base + '/index.html'); await settle(page);
    await page.locator(BOOKING_SEL).first().evaluate((a) => { a.target = ''; a.addEventListener('click', (e) => e.preventDefault()); });
    await page.locator(BOOKING_SEL).first().click(); await settle(page);
    const click = sent.find((e) => e.event === 'booking_click');
    expect(click).toBeTruthy();
    expect(await fbqQueue(page)).toContainEqual(['track', 'Schedule', {}, { eventID: click.event_id }]);
  });

  test('GPC + Accept all: the Pixel never loads', async ({ page }) => {
    const { fb } = await instrument(page, { gpc: true });
    await page.goto(base + LANDING); await settle(page);
    await page.click('.cc-banner [data-cc="accept"]'); await settle(page);
    await submitLead(page, 'captain@example.com');
    expect(fb).toEqual([]);
    expect(await page.evaluate(() => typeof window.fbq)).toBe('undefined');
  });

  test('withdraw advertising: revoke, _fbp/_fbc deleted, nothing from Meta after reload', async ({ page }) => {
    const { fb } = await instrument(page);
    await page.goto(base + '/index.html'); await settle(page);
    await page.click('.cc-banner [data-cc="accept"]'); await settle(page);
    expect(fb.length).toBeGreaterThan(0);
    await page.evaluate(() => { document.cookie = '_fbp=fb.1.1793350000000.1234567890; path=/'; document.cookie = '_fbc=fb.1.1793350000000.IwAR0x; path=/'; document.cookie = 'keep_me=1; path=/'; });
    await page.evaluate(() => window.celesteCookieSettings());
    await page.uncheck('#cc-ads');
    // Record fbq('consent', ...) in sessionStorage: it survives the reload that withdrawal triggers.
    await page.evaluate(() => {
      const orig = window.fbq;
      window.fbq = function () { if (arguments[0] === 'consent') sessionStorage.setItem('fbq_consent', JSON.stringify(Array.from(arguments))); return orig.apply(this, arguments); };
    });
    await Promise.all([page.waitForEvent('load'), page.click('.cc-panel [data-cc="save"]')]);
    expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('fbq_consent')))).toEqual(['consent', 'revoke']);
    await settle(page);
    const names = (await page.context().cookies()).map((c) => c.name);
    expect(names).not.toContain('_fbp');
    expect(names).not.toContain('_fbc');
    expect(names).toContain('keep_me');
    fb.length = 0;
    await page.reload(); await settle(page);
    expect(fb).toEqual([]);
    expect(await page.evaluate(() => window.celesteConsent.get())).toMatchObject({ analytics: true, ads: false });
  });
});
