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
 * - Preserves every existing <loc>/<priority>, and the <lastmod> of every NON-blog page (static pages kept
 *   verbatim). Parsing splits on <loc> so a missing </url> can't fuse rows.
 * - Blog posts: <lastmod> = the post's real last CONTENT change from git history (committer date, %cI, of the
 *   newest commit that changed the post's article text; see lib/post-lastmod.mjs). Not the build date, and not a
 *   site-wide chrome commit. Uncommitted article edits => --date / today; an untracked post keeps its existing
 *   lastmod (or --date / today when it is new).
 * - Adds any blogs/*.html not yet listed (priority 0.9).
 * - --sync-jsonld: also rewrites each post's BlogPosting JSON-LD so dateModified == that sitemap lastmod and
 *   author == lib/jsonld.mjs AUTHOR. JSON-LD lives in <head>, so this never counts as a content change itself.
 * - Emits VALID, deterministic XML. Idempotent: same git history => byte-identical output.
 *
 * Usage: node content-engine/gen-sitemap.mjs [--date=YYYY-MM-DD] [--sync-jsonld]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { postContentLastmod } from './lib/post-lastmod.mjs';
import { AUTHOR, ldScript } from './lib/jsonld.mjs';

const ROOT = process.cwd();
const SITEMAP = join(ROOT, 'sitemap.xml');
const ORIGIN = 'https://celeste7.ai';
const dateArg = process.argv.find((a) => a.startsWith('--date='));
const TODAY = dateArg ? dateArg.split('=')[1] : new Date().toISOString().slice(0, 10);
const SYNC_JSONLD = process.argv.includes('--sync-jsonld');

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
const postLastmod = new Map(); // file -> lastmod written to the sitemap
for (const f of blogFiles) {
  const loc = `${ORIGIN}/blogs/${f.replace(/\.html$/, '')}`;
  const prev = existing.get(loc);
  if (!prev) added++;
  const r = postContentLastmod(ROOT, `blogs/${f}`);
  const lastmod = r ? (r.date || TODAY) : (prev ? prev.lastmod : TODAY);
  existing.set(loc, { lastmod, priority: prev ? prev.priority : '0.9' });
  postLastmod.set(f, lastmod);
}

// 2b. Optional: keep each post's JSON-LD dateModified (and author) in step with the sitemap.
let synced = 0;
if (SYNC_JSONLD) {
  const blockRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const isoFull = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00+00:00` : d);
  for (const [f, lastmod] of postLastmod) {
    const path = join(blogsDir, f);
    const html = readFileSync(path, 'utf8');
    const m = html.match(blockRe);
    if (!m) continue;
    const ld = JSON.parse(m[1]);
    const post = (ld['@graph'] || [ld]).find((n) => /^(Blog|News)?Posting$|^Article$/.test(n && n['@type']));
    if (!post) continue;
    post.dateModified = isoFull(lastmod);
    post.author = AUTHOR;
    const next = html.replace(m[0], ldScript(ld));
    if (next !== html) { writeFileSync(path, next, 'utf8'); synced++; }
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
  `sitemap: ${ordered.length} urls (${blogFiles.length} blog files; +${added} newly added) — valid XML written.` +
    (SYNC_JSONLD ? ` JSON-LD synced in ${synced} post(s).` : ''),
);
