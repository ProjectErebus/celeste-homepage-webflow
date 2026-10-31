#!/usr/bin/env node
/**
 * gen-sitemap.mjs — regenerate sitemap.xml deterministically from the live blog set +
 * the existing static-page entries. Run from the SITE ROOT.
 *
 * WHY THIS EXISTS: the content engine used to hand-edit sitemap.xml inside every PR, so any
 * two open engine PRs conflicted on it — and one edit even left MALFORMED XML (a <url> with
 * no </url>, silently merging two entries). The sitemap is a DERIVED artifact and must be
 * generated, never hand-merged. Engine PRs now add ONLY blogs/<slug>.html (unique per slug →
 * never conflicts); this regenerates the sitemap on main.
 *
 * - Preserves every existing <loc>/<lastmod>/<priority> in sitemap.xml (real lastmods + the
 *   static pages kept verbatim). Parsing splits on <loc> so a missing </url> can't fuse rows.
 * - Adds any blogs/*.html not yet listed (lastmod = --date or today, priority 0.9).
 * - Emits VALID, deterministic XML. Idempotent: no new blogs => byte-identical output.
 *
 * Usage: node content-engine/gen-sitemap.mjs [--date=YYYY-MM-DD]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SITEMAP = join(ROOT, 'sitemap.xml');
const ORIGIN = 'https://celeste7.ai';
const dateArg = process.argv.find((a) => a.startsWith('--date='));
const TODAY = dateArg ? dateArg.split('=')[1] : new Date().toISOString().slice(0, 10);

// 1. Parse existing entries (robust to malformed XML): one record per <loc> block.
const existing = new Map(); // loc -> { lastmod, priority }
if (existsSync(SITEMAP)) {
  const xml = readFileSync(SITEMAP, 'utf8');
  const blockRe = /<loc>\s*([^<]+?)\s*<\/loc>([\s\S]*?)(?=<loc>|<\/urlset>|$)/g;
  let m;
  while ((m = blockRe.exec(xml))) {
    const loc = m[1].trim();
    if (loc === `${ORIGIN}/blogs/index`) continue; // redirects to /blogs (listed separately); never a sitemap entry
    const rest = m[2];
    const lastmod = (rest.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/) || [])[1];
    const priority = (rest.match(/<priority>\s*([^<]+?)\s*<\/priority>/) || [])[1];
    existing.set(loc, {
      lastmod: lastmod || TODAY,
      priority: priority || (loc === `${ORIGIN}/` ? '1.0' : '0.8'),
    });
  }
}

// 2. Ensure every live blog file is present.
const blogsDir = join(ROOT, 'blogs');
// blogs/index.html is the blog index, served (and listed) as /blogs; /blogs/index only 308-redirects there, and a
// redirecting URL in a sitemap is reported by Search Console and the bcc web feed (sitemap.redirecting_url).
const blogFiles = existsSync(blogsDir) ? readdirSync(blogsDir).filter((f) => f.endsWith('.html') && f !== 'index.html') : [];
let added = 0;
for (const f of blogFiles) {
  const loc = `${ORIGIN}/blogs/${f.replace(/\.html$/, '')}`;
  if (!existing.has(loc)) {
    existing.set(loc, { lastmod: TODAY, priority: '0.9' });
    added++;
  }
}

// 3. Deterministic order: homepage first, then everything else by loc.
const entries = [...existing.entries()].map(([loc, v]) => ({ loc, ...v }));
const home = entries.filter((e) => e.loc === `${ORIGIN}/`);
const rest = entries
  .filter((e) => e.loc !== `${ORIGIN}/`)
  .sort((a, b) => a.loc.localeCompare(b.loc));
const ordered = [...home, ...rest];

// 4. Emit valid XML.
const urlBlock = (e) =>
  `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <priority>${e.priority}</priority>\n  </url>`;
const out =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  ordered.map(urlBlock).join('\n') +
  `\n</urlset>\n`;
writeFileSync(SITEMAP, out, 'utf8');
console.log(
  `sitemap: ${ordered.length} urls (${blogFiles.length} blog files; +${added} newly added) — valid XML written.`,
);
