import { test, expect } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Consent / GPC compliance (US CCPA/CPRA + UK/EU ePrivacy/GDPR).
 *
 * Hermetic: serves the repo over a local static server and intercepts every third-party
 * request, so the assertions are about what the PAGE asks for, not what the network allows.
 * Run: npx playwright test tests/consent --project=chromium
 */

const ROOT = path.resolve(__dirname, '../..');
const TRACKER = /googletagmanager\.com|google-analytics\.com|googleadservices\.com|doubleclick\.net|contentsquare\.net|hotjar\.(com|io)|facebook\.(net|com)/i;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };

// Every public page that carries the consent manager + footer link.
const PAGES = [
  '/index.html', '/about.html', '/privacy-policy.html', '/terms-of-service.html', '/trust.html', '/sources.html',
  '/blogs/index.html', '/blogs/audit-trail-superyacht.html', '/handover.html', '/records.html', '/search.html',
  '/intelligence.html', '/404.html', '/401.html', '/landing-v2.html', '/landing-v3.html', '/landing-v4.html',
  '/cookies.html', '/acceptable-use.html', '/subprocessors.html',
];

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

/** Record tracker requests; stub every off-origin request so tests are fast and offline. */
async function instrument(page, { gpc = false } = {}) {
  const hits = [];
  if (gpc) {
    await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true, configurable: true }));
  }
  await page.context().route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(base)) return route.continue();
    if (TRACKER.test(url)) hits.push(url);
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
  });
  return hits;
}
const settle = (page) => page.waitForTimeout(400);
const dataLayer = (page) => page.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)));
const configs = async (page) => (await dataLayer(page)).filter((a) => a[0] === 'config').map((a) => a[1]);
const lastUpdate = async (page) => (await dataLayer(page)).filter((a) => a[0] === 'consent' && a[1] === 'update').pop()?.[2];

test.describe('Consent manager', () => {
  test('no tracker is requested before consent, on any page', async ({ page }) => {
    const hits = await instrument(page);
    for (const p of PAGES) {
      await page.goto(base + p);
      await settle(page);
      await expect(page.locator('.cc-banner'), p).toBeVisible();
      await expect(page.locator('[data-privacy-choices]').first(), p).toBeAttached();
      const defaults = (await dataLayer(page)).find((a) => a[0] === 'consent' && a[1] === 'default')?.[2];
      expect(defaults, p).toMatchObject({ ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    }
    expect(hits).toEqual([]);
  });

  test('blog template carries the consent manager and the privacy-choices link, no inline tag', async () => {
    const tpl = fs.readFileSync(path.join(ROOT, 'content-engine/templates/post.html'), 'utf8');
    expect(tpl).toContain('<script src="/js/cookie-consent.js"></script>');
    expect(tpl).toContain('data-privacy-choices');
    expect(tpl).not.toMatch(/googletagmanager|gtag\('config'/);
  });

  test('first layer: Accept all and Reject all have equal prominence', async ({ page }) => {
    await instrument(page);
    await page.goto(base + '/index.html');
    const a = page.locator('.cc-banner [data-cc="accept"]');
    const r = page.locator('.cc-banner [data-cc="reject"]');
    const style = (l) => l.evaluate((el) => { const s = getComputedStyle(el); return [s.backgroundColor, s.color, s.fontSize, s.fontWeight, s.borderTopWidth].join('|'); });
    expect(await style(a)).toBe(await style(r));
    const [ba, br] = [await a.boundingBox(), await r.boundingBox()];
    expect(Math.abs(ba.height - br.height)).toBeLessThan(1);
  });

  test('reject: no trackers now, after reload, or on the next page', async ({ page }) => {
    const hits = await instrument(page);
    await page.goto(base + '/index.html');
    await page.click('.cc-banner [data-cc="reject"]');
    await settle(page);
    await page.reload(); await settle(page);
    await expect(page.locator('.cc-banner')).toHaveCount(0);
    await page.goto(base + '/blogs/audit-trail-superyacht.html'); await settle(page);
    expect(hits).toEqual([]);
    expect(await configs(page)).toEqual([]);
  });

  test('accept analytics only: GA4 + Contentsquare load, Google Ads does not', async ({ page }) => {
    const hits = await instrument(page);
    await page.goto(base + '/index.html');
    await page.click('.cc-banner [data-cc="manage"]');
    await page.check('#cc-analytics');
    await expect(page.locator('#cc-ads')).not.toBeChecked();
    await page.click('.cc-panel [data-cc="save"]');
    await settle(page);
    expect(hits.some((u) => /googletagmanager\.com\/gtag\/js\?id=G-230QN4JY4P/.test(u))).toBe(true);
    expect(hits.some((u) => /contentsquare\.net/.test(u))).toBe(true);
    expect(hits.filter((u) => /AW-17947526022|facebook/.test(u))).toEqual([]);
    expect(await configs(page)).toEqual(['G-230QN4JY4P']);
    expect(await lastUpdate(page)).toMatchObject({ analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    // consent update is queued BEFORE gtag.js is injected
    const dl = await dataLayer(page);
    expect(dl.findIndex((a) => a[0] === 'consent' && a[1] === 'update')).toBeLessThan(dl.findIndex((a) => a[0] === 'js'));
  });

  test('accept all (no GPC): Ads is configured too', async ({ page }) => {
    await instrument(page);
    await page.goto(base + '/index.html');
    await page.click('.cc-banner [data-cc="accept"]');
    await settle(page);
    expect((await configs(page)).sort()).toEqual(['AW-17947526022', 'G-230QN4JY4P']);
    expect(await lastUpdate(page)).toMatchObject({ ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' });
  });

  test('GPC=true + Accept all: Google Ads never loads, ad signals stay denied, note shown', async ({ page }) => {
    const hits = await instrument(page, { gpc: true });
    await page.goto(base + '/index.html');
    await expect(page.locator('.cc-banner')).toContainText('Global Privacy Control');
    await page.click('.cc-banner [data-cc="accept"]');
    await settle(page);
    await page.reload(); await settle(page);
    expect(hits.filter((u) => /AW-17947526022|googleadservices|doubleclick|facebook/.test(u))).toEqual([]);
    expect(await configs(page)).toEqual(['G-230QN4JY4P']);
    expect(await lastUpdate(page)).toMatchObject({ analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    await page.locator('[data-privacy-choices]').first().click();
    await expect(page.locator('[data-cc="gpc-note"]')).toContainText('Global Privacy Control signal honored');
    await expect(page.locator('#cc-ads')).toBeDisabled();
    await expect(page.locator('#cc-ads')).not.toBeChecked();
  });

  test('withdraw via footer "Your Privacy Choices": cookies deleted, no further loads', async ({ page }) => {
    const hits = await instrument(page);
    await page.goto(base + '/index.html');
    await page.click('.cc-banner [data-cc="accept"]');
    await settle(page);
    expect(hits.length).toBeGreaterThan(0);
    await page.evaluate(() => { document.cookie = '_ga=GA1.1.123.456; path=/'; document.cookie = '_gcl_au=1.1.1; path=/'; document.cookie = '_hjSessionUser_1=x; path=/'; document.cookie = 'keep_me=1; path=/'; });
    await page.locator('[data-privacy-choices]').first().click();
    await expect(page.locator('.cc-panel')).toBeVisible();
    await expect(page.locator('#cc-analytics')).toBeChecked();
    await Promise.all([page.waitForEvent('load'), page.click('.cc-panel [data-cc="reject"]')]);
    await settle(page);
    const names = (await page.context().cookies()).map((c) => c.name);
    expect(names).not.toContain('_ga');
    expect(names).not.toContain('_gcl_au');
    expect(names).not.toContain('_hjSessionUser_1');
    expect(names).toContain('keep_me');
    hits.length = 0;
    await page.reload(); await settle(page);
    await page.goto(base + '/about.html'); await settle(page);
    expect(hits).toEqual([]);
    expect(await configs(page)).toEqual([]);
    expect(await page.evaluate(() => window.celesteConsent.get())).toMatchObject({ analytics: false, ads: false });
  });

  test('a stored choice from an older consent version re-prompts and loads nothing', async ({ page }) => {
    const hits = await instrument(page);
    await page.addInitScript(() => {
      localStorage.setItem('celeste_cookie_consent_v1', 'granted');
      localStorage.setItem('celeste_consent', JSON.stringify({ v: '2000-01-01', analytics: true, ads: true }));
    });
    await page.goto(base + '/index.html');
    await settle(page);
    await expect(page.locator('.cc-banner')).toBeVisible();
    expect(hits).toEqual([]);
  });
});
