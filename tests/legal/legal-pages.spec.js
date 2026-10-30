import { test, expect } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/**
 * CelesteOS LLC legal pages smoke test.
 *
 * Serves the repo locally with Vercel-style clean URLs (/cookies -> cookies.html), or, when
 * LEGAL_BASE_URL is set (e.g. a Vercel preview or https://celeste7.ai), runs against that origin.
 * Run: npx playwright test tests/legal --project=chromium
 */

const ROOT = path.resolve(__dirname, '../..');
const ROUTES = ['/privacy-policy', '/terms-of-service', '/cookies', '/acceptable-use', '/subprocessors'];
const FORBIDDEN = /Celeste7 LTD|Celeste7 Ltd|16617331|Drafting note|«|in progress\)|not yet appointed|General Legal|vendor confirmation/i;
const DRAFTING = /Drafting note|Pre-issue|Status note|UI alignment|Counsel note|Confirmed fix|Supabase/;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml' };

let server;
let base = process.env.LEGAL_BASE_URL;
test.beforeAll(async () => {
  if (base) return;
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    let file = path.join(ROOT, p);
    if (!path.extname(file) && fs.existsSync(file + '.html')) file += '.html';
    else if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { if (server) await new Promise((r) => server.close(r)); });

test.describe.configure({ mode: 'serial' });

test.describe('Legal pages (CelesteOS LLC)', () => {
  for (const route of ROUTES) {
    test(`${route}: 200, CelesteOS LLC, no placeholders or drafting notes`, async ({ request }) => {
      const res = await request.get(base + route);
      expect(res.status()).toBe(200);
      const body = await res.text();
      expect(body).toContain('CelesteOS LLC');
      // v1.1 (31 Oct 2026) of the Cookie Notice and Privacy Policy discloses the Meta Pixel; the others stay v1.0.
      const updated = ['/cookies', '/privacy-policy'].includes(route) ? 'October 31, 2026' : 'October 15, 2026';
      expect(body).toContain(`Last updated: ${updated}`);
      expect(body).not.toMatch(FORBIDDEN);
      expect(body).not.toMatch(DRAFTING);
      expect(body).not.toContain('Template — to be reviewed');
      expect(body).toContain('<script src="/js/cookie-consent.js"></script>');
      expect(body).toContain('data-privacy-choices');
    });

    test(`${route}: no horizontal page scroll at 375px`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const page = await ctx.newPage();
      await page.route('**/*', (r) => (r.request().url().startsWith(base) ? r.continue() : r.fulfill({ status: 200, body: '' })));
      await page.goto(base + route);
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(sw).toBeLessThanOrEqual(cw);
      await ctx.close();
    });
  }

  test('/privacy-policy keeps the #cookies anchor', async ({ request }) => {
    const body = await (await request.get(base + '/privacy-policy')).text();
    expect(body).toMatch(/id="cookies"/);
  });

  test('sub-processor page publishes Part A only', async ({ request }) => {
    const body = await (await request.get(base + '/subprocessors')).text();
    expect(body).not.toMatch(/Part B —|Hetzner|OpenAI|Anthropic|Vercel Inc|Cloudflare Inc|Redis Ltd|TypeSafe|Sentry|FreeTSA|DigiCert/);
  });

  test('no page in the sitemap names the old entity', async ({ request }) => {
    const xml = await (await request.get(base + '/sitemap.xml')).text();
    const locs = [...xml.matchAll(/<loc>https:\/\/celeste7\.ai([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
    expect(locs).toEqual(expect.arrayContaining(ROUTES));
    for (const loc of locs) {
      const res = await request.get(base + loc);
      expect(res.status(), loc).toBe(200);
      const body = await res.text();
      expect(body, loc).not.toMatch(FORBIDDEN);
      expect(body, loc).toContain('CelesteOS LLC');
    }
  });
});
