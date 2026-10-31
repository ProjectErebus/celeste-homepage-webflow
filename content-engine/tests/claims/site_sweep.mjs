#!/usr/bin/env node
// site_sweep.mjs — run the claims gate over every live page of celeste7.ai. Node stdlib only, $0.
//
//   node content-engine/tests/claims/site_sweep.mjs [--json] [--root <site checkout>]
//
// Live pages = the <loc> entries in sitemap.xml, plus llms.txt. Legal pages are not marketing
// copy and are excluded, matching check_no_beside_pms.sh (privacy-policy, terms-of-service,
// cookies, acceptable-use, subprocessors).
//   - /blogs/<slug> posts: the full blog gate (claims CC01–CC04 + structure CC08 + assets CC09),
//     exactly what `node content-engine/gate.mjs blogs/<slug>.html` reports.
//   - other pages (/, /about, /trust, /sources, /blogs): claims CC01–CC04 on channel blog
//     (site body; negated phrases WARN per FD-29d). Page-level SEO structure is out of scope here.
//   - llms.txt: claims CC01–CC04 on channel page_meta.
// Exit 0 when no page has a FAIL; 1 otherwise.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPack, checkArtifact } from '../../lib/claims-check.mjs';
import { legacyView } from '../../lib/check.mjs';

const rootArg = process.argv.indexOf('--root');
const ROOT = rootArg > 0 ? process.argv[rootArg + 1] : join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const LEGAL = new Set(['privacy-policy', 'terms-of-service', 'cookies', 'acceptable-use', 'subprocessors']);
const pack = loadPack();
const locs = [...readFileSync(join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/celeste7\.ai\/?([^<]*)<\/loc>/g)].map(m => m[1].replace(/\/$/, ''));
const pages = [];
for (const p of locs) {
  if (LEGAL.has(p)) continue;
  const file = p === '' ? 'index.html' : p === 'blogs' ? 'blogs/index.html' : `${p}.html`;
  if (!existsSync(join(ROOT, file))) { pages.push({ file, missing: true }); continue; }
  pages.push({ file, post: /^blogs\/[a-z0-9-]+$/.test(p) && p !== 'blogs' });
}
pages.push({ file: 'llms.txt', llms: true });

const CONTENT_ONLY = ['CC05', 'CC06', 'CC07', 'CC08', 'CC09', 'CC10', 'CC11'];
const rows = [];
let failing = 0;
for (const pg of pages) {
  if (pg.missing) { rows.push({ file: pg.file, verdict: 'fail', fails: [{ rule: 'missing file' }], warns: [] }); failing++; continue; }
  const raw = readFileSync(join(ROOT, pg.file), 'utf8');
  const res = pg.llms
    ? checkArtifact({ channel: 'page_meta', fields: { llms_txt: raw }, claim_provenance: { claims: [] } }, { pack, skip: CONTENT_ONLY })
    : checkArtifact({ channel: 'blog', fields: { page_html: raw } }, { pack, legacy: true, skip: pg.post ? [] : CONTENT_ONLY });
  const v = legacyView(res, pack);
  const fails = v.filter(x => x.sev === 'FAIL'), warns = v.filter(x => x.sev === 'WARN');
  if (fails.length) failing++;
  rows.push({ file: pg.file, scope: pg.llms ? 'page_meta CC01-04' : pg.post ? 'blog post: full gate' : 'site page: CC01-04', verdict: fails.length ? 'fail' : warns.length ? 'warn' : 'pass',
    fails: fails.map(x => ({ line: x.line, rule: x.rule, quote: x.quote })), warns: warns.map(x => ({ line: x.line, rule: x.rule, quote: x.quote })) });
}
if (process.argv.includes('--json')) console.log(JSON.stringify({ pack: { id: pack.id, sha256: pack.sha256 }, pages: rows.length, failing, rows }, null, 1));
else {
  for (const r of rows) {
    console.log(`${r.verdict.toUpperCase().padEnd(5)} ${r.file}  (${r.scope || ''}) fails=${r.fails.length} warns=${r.warns.length}`);
    for (const f of r.fails) console.log(`        FAIL L${f.line} ${f.rule}: "${f.quote}"`);
    for (const w of r.warns) console.log(`        warn L${w.line} ${w.rule}: "${w.quote}"`);
  }
  console.log(`\nsite sweep: ${rows.length} live pages, ${failing} failing`);
}
process.exit(failing ? 1 : 0);
