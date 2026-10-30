import { test, expect } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/**
 * First-party attribution (js/celeste-attribution.js): nothing stored or sent before analytics consent;
 * landing / booking_click / lead_submit sent to the control-plane collector after it; withdrawal forgets.
 * Hermetic: local static server, every off-origin request stubbed, collector requests captured.
 * Run: npx playwright test tests/consent/attribution.spec.js --project=chromium
 */

const ROOT = path.resolve(__dirname, '../..');
const COLLECTOR = 'https://control.celeste7.ai/api/collect/web';
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

async function capture(page) {
  const sent = [];
  await page.context().route('**/*', (route) => {
    const req = route.request();
    const url = req.url();
    if (url.startsWith(base)) return route.continue();
    if (url === COLLECTOR) {
      try { sent.push(JSON.parse(req.postData() || '{}')); } catch { sent.push({ unparsable: true }); }
      return route.fulfill({ status: 202, contentType: 'application/json', body: '{"received":true}' });
    }
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
  });
  return sent;
}
const settle = (page) => page.waitForTimeout(500);
const store = (page) => page.evaluate(() => ({ anon: localStorage.getItem('celeste_anon'), ft: localStorage.getItem('celeste_ft'), lt: localStorage.getItem('celeste_lt') }));
const LANDING = '/index.html?utm_source=google&utm_medium=cpc&utm_campaign=pilot-q4&gclid=TESTGCLID';

test.describe('First-party attribution', () => {
  test('before consent and after reject: nothing stored, nothing sent', async ({ page }) => {
    const sent = await capture(page);
    await page.goto(base + LANDING); await settle(page);
    expect(await store(page)).toEqual({ anon: null, ft: null, lt: null });
    await page.click('.cc-banner [data-cc="reject"]'); await settle(page);
    await page.locator('a[href^="https://outlook.office.com/book/"]').first().dispatchEvent('click');
    await settle(page);
    expect(sent).toEqual([]);
    expect(await store(page)).toEqual({ anon: null, ft: null, lt: null });
  });

  test('accept: landing with UTMs + first/last touch, then booking_click with the same anon_id', async ({ page }) => {
    const sent = await capture(page);
    await page.goto(base + LANDING); await settle(page);
    await page.click('.cc-banner [data-cc="accept"]'); await settle(page);
    const landing = sent.find((e) => e.event === 'landing');
    expect(landing).toMatchObject({ utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'pilot-q4', gclid: 'TESTGCLID', consent: { analytics: true, ads: true } });
    expect(landing.anon_id).toBeTruthy();
    expect(landing.first_touch).toMatchObject({ utm_source: 'google', gclid: 'TESTGCLID' });
    expect(landing.email).toBeUndefined();

    await page.locator('a[href^="https://outlook.office.com/book/"]').first().evaluate((a) => { a.target = ''; a.addEventListener('click', (e) => e.preventDefault()); });
    await page.locator('a[href^="https://outlook.office.com/book/"]').first().click(); await settle(page);
    const click = sent.find((e) => e.event === 'booking_click');
    expect(click).toMatchObject({ anon_id: landing.anon_id, first_touch: { utm_campaign: 'pilot-q4' } });
    // Bookings link is not rewritten (Bookings does not carry custom params into the appointment).
    expect(await page.locator('a[href^="https://outlook.office.com/book/"]').first().getAttribute('href')).toBe('https://outlook.office.com/book/CelesteOSPilot@celeste7.ai/');
  });

  test('lead magnet submit sends lead_submit with the typed email and anon_id', async ({ page }) => {
    const sent = await capture(page);
    await page.goto(base + LANDING); await settle(page);
    await page.click('.cc-banner [data-cc="accept"]'); await settle(page);
    await page.fill('#lm-vessel', 'M/Y Test');
    for (const inp of await page.locator('#lm-entries input').all()) await inp.fill('job done');
    await page.fill('#lm-email', 'captain@example.com');
    await page.locator('#magnet-form').evaluate((f) => f.requestSubmit());
    await settle(page);
    const lead = sent.find((e) => e.event === 'lead_submit');
    expect(lead).toMatchObject({ email: 'captain@example.com', consent: { analytics: true } });
    expect(lead.anon_id).toBe(sent.find((e) => e.event === 'landing').anon_id);
  });

  test('withdrawal deletes the first-party ids', async ({ page }) => {
    await capture(page);
    await page.goto(base + LANDING); await settle(page);
    await page.click('.cc-banner [data-cc="accept"]'); await settle(page);
    expect((await store(page)).anon).toBeTruthy();
    await page.evaluate(() => window.celesteCookieSettings());
    await page.click('.cc-panel [data-cc="reject"]');
    await page.waitForLoadState('load'); await settle(page);
    expect(await store(page)).toEqual({ anon: null, ft: null, lt: null });
  });
});
