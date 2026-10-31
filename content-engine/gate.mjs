#!/usr/bin/env node
// gate.mjs — the enforceable truth + brand firewall (CLI). Node stdlib only.
// The checks live in lib/claims-check.mjs (one claims check for every channel, spec 29);
// this file is the command line around them.
//
//   node gate.mjs <file|posts/slug>                 blog gate, human report (unchanged UX). Exit 0 clean · 1 violation · 2 usage
//   node gate.mjs <page.html> --site                a site page (not a blog post): an exact commercial.C* line inside data-pricing is allowed (FD2)
//   node gate.mjs <file> --channel <c> [--json]     same file checked on another channel (blog|page_meta|email|linkedin|meta|google_ads|social_generic)
//   node gate.mjs <file|posts/slug> --json          ClaimsCheckResult JSON (ReviewRecord check shape) on stdout
//   node gate.mjs --artifact <input.json>           full ClaimsCheckInput → JSON. Exit 0 pass|warn · 1 fail · 3 insufficient_evidence · 2 usage
//   node gate.mjs --blind <cases.tsv>               one JSON line per case {"case_id","verdict","rule_ids"}; always exit 0 (the caller scores)
//   node gate.mjs --pack-info                       {"id","version","sha256"} of lib/claims.json
//   node gate.mjs --self-test                       built-in PASS/FAIL fixtures
//
// Fail-closed: if lib/claims.json does not match lib/claims.json.sha256 or was generated from a
// different claims-allowlist.md, every mode refuses (blog gate exit 1, artifact exit 3).
import { readFileSync, existsSync, statSync, mkdtempSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { loadPack, checkArtifact, exitCodeFor, contentVerdict, CHANNELS, PackIntegrityError } from './lib/claims-check.mjs';
import { checkText, legacyView } from './lib/check.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

function getPack() {
  try { return loadPack(); }
  catch (e) {
    if (e instanceof PackIntegrityError) { console.error(`gate: FAIL-CLOSED — claims pack integrity: ${e.message}`); return null; }
    throw e;
  }
}

// Resolve a target path into one artifact (fields) + display names.
function loadTarget(target) {
  const p = resolve(target);
  if (!existsSync(p)) { console.error(`gate: not found: ${p}`); return null; }
  if (statSync(p).isDirectory()) {
    const draft = join(p, 'draft.html'), meta = join(p, 'meta.json');
    if (!existsSync(draft)) { console.error(`gate: ${draft} missing`); return null; }
    const parts = [{ name: draft, field: 'draft_html', text: readFileSync(draft, 'utf8') }];
    if (existsSync(meta)) parts.push({ name: meta, field: 'meta_json', text: readFileSync(meta, 'utf8') });
    return parts;
  }
  const text = readFileSync(p, 'utf8');
  const fullPage = /<html[\s>]/i.test(text) || /<head[\s>]/i.test(text);
  const field = /\.json$/i.test(p) ? 'meta_json' : fullPage ? 'page_html' : 'draft_html';
  return [{ name: p, field, text }];
}

function report(name, violations) {
  const fails = violations.filter(v => v.sev === 'FAIL');
  const warns = violations.filter(v => v.sev === 'WARN');
  if (!violations.length) { console.log(`PASS  ${name} — clean`); return 0; }
  console.log(`\n${name}`);
  for (const v of [...fails, ...warns].sort((a, b) => a.line - b.line)) {
    let msg = `  ${v.sev === 'FAIL' ? 'FAIL' : 'warn'}  L${v.line}  ${v.rule}: "${v.quote}"`;
    if (v.safe) msg += `\n        → safe: ${v.safe}`;
    console.log(msg);
  }
  return fails.length;
}

// ─── --blind <tsv> ─────────────────────────────────────────────────────────
// Columns: case_id, rule_id, family, channel, expect, text  (header row required; "\n" in text = newline).
// Each text is checked on its row's channel with no provenance, so only the banned / call-only /
// host rules (CC01–CC04) decide it. Output contract: one JSON line per data row,
//   {"case_id", "verdict": "pass"|"warn"|"fail", "rule_ids": [...]}   and the process always exits 0.
// Channel names are case-insensitive with aliases; an unknown channel is checked as a non-blog
// channel (page_meta) and noted on stderr. A row that cannot be checked (no text column, empty text,
// pack integrity failure) is emitted as verdict "fail" with rule_ids ["INPUT"] or ["PACK"].
const CHANNEL_ALIAS = { blog: 'blog', post: 'blog', page_meta: 'page_meta', pagemeta: 'page_meta', page: 'page_meta', site: 'page_meta', web: 'page_meta',
  website: 'page_meta', meta_tags: 'page_meta', llms: 'page_meta', email: 'email', 'e-mail': 'email', mail: 'email', newsletter: 'email',
  linkedin: 'linkedin', 'linked in': 'linkedin', li: 'linkedin', meta: 'meta', meta_ads: 'meta', 'meta ads': 'meta', facebook_ads: 'meta', 'facebook ads': 'meta',
  instagram_ads: 'meta', google_ads: 'google_ads', 'google ads': 'google_ads', googleads: 'google_ads', google: 'google_ads', adwords: 'google_ads', rsa: 'google_ads',
  social_generic: 'social_generic', social: 'social_generic', facebook: 'social_generic', instagram: 'social_generic', fb: 'social_generic', ig: 'social_generic',
  twitter: 'social_generic', x: 'social_generic' };
export function canonicalChannel(c) {
  const k = String(c ?? '').trim().toLowerCase().replace(/[\s-]+/g, m => (m.includes(' ') ? ' ' : '-'));
  return CHANNEL_ALIAS[k] ?? CHANNEL_ALIAS[k.replace(/[\s-]+/g, '_')] ?? null;
}
export function blindLines(tsvText, pack, warn = () => {}) {
  const lines = tsvText.replace(/^﻿/, '').replace(/\r/g, '').split('\n').filter(l => l.trim().length);
  if (!lines.length) { warn('empty file: no cases'); return []; }
  const cols = lines[0].split('\t').map(c => c.trim().toLowerCase());
  const hasText = cols.includes('text');
  if (!hasText) warn('header has no "text" column: every row is emitted as fail ["INPUT"]');
  if (!cols.includes('case_id')) warn('header has no "case_id" column: rows are numbered');
  if (!pack) warn('claims pack failed its integrity check: every row is emitted as fail ["PACK"]');
  const unknown = new Set();
  const out = lines.slice(1).map((r, k) => {
    const o = Object.fromEntries(r.split('\t').map((v, i) => [cols[i], v.replace(/\\n/g, '\n')]));
    const case_id = o.case_id ?? `row-${k + 2}`;
    if (!pack) return JSON.stringify({ case_id, verdict: 'fail', rule_ids: ['PACK'] });
    if (!hasText || o.text == null || !o.text.trim()) return JSON.stringify({ case_id, verdict: 'fail', rule_ids: ['INPUT'] });
    let channel = canonicalChannel(o.channel || 'page_meta');
    if (!channel) { unknown.add(o.channel); channel = 'page_meta'; }
    const res = checkArtifact({ channel, fields: { body: o.text }, claim_provenance: { claims: [] } },
      { pack, skip: ['CC05', 'CC06', 'CC07', 'CC08', 'CC09', 'CC10', 'CC11'] });
    const rule_ids = [...new Set(res.violations.filter(v => ['CC01', 'CC02', 'CC03', 'CC04'].includes(v.id)).map(v => v.rule_id))];
    let verdict = contentVerdict(res);
    if (!['pass', 'warn', 'fail'].includes(verdict)) verdict = 'fail';
    return JSON.stringify({ case_id, verdict, rule_ids });
  });
  if (unknown.size) warn(`unknown channel(s) ${[...unknown].map(c => JSON.stringify(c)).join(', ')}: checked as page_meta (non-blog)`);
  return out;
}

// ─── self-test ──────────────────────────────────────────────────────────────
function selfTest(pack) {
  let pass = 0, fail = 0;
  const ok = (cond, label, extra) => { if (cond) { pass++; console.log(`  PASS  ${label}`); } else { fail++; console.log(`  FAIL  ${label}`); if (extra) console.log(`          ${extra}`); } };
  const fixtures = [
    // [label, body, expectFail(boolean), fullPage]
    ['clean handover line', '<p>The handover draft is captured as you work. Both sides sign.</p>', false, false],
    ['banned: writes itself', '<p>The handover writes itself overnight.</p>', true, false],
    ['banned: auto-generated', '<p>An auto-generated handover document.</p>', true, false],
    ['banned: assembles itself', '<p>The handover assembles itself as the engineer works.</p>', true, false],
    ['banned: every domain', '<p>Search returns results from every domain at once.</p>', true, false],
    ['banned: mapped to root cause', '<p>Fault history mapped to root cause.</p>', true, false],
    ['banned: cascade (suggested-docs)', '<p>Accept once and it cascades everywhere.</p>', true, false],
    ['banned: knowledge graph', '<p>It walks the knowledge graph for you.</p>', true, false],
    ['banned: real-time', '<p>Real-time vessel data, always current.</p>', true, false],
    ['banned: sealed pdf', '<p>Download the sealed PDF of the trail.</p>', true, false],
    ['lexicon: automate', '<p>CelesteOS will automate your handover.</p>', true, false],
    ['lexicon: AI as product claim', '<p>Our AI reads your manuals for you.</p>', true, false],
    ['lexicon: AI editorial → warn only', '<p data-editorial>The industry talks endlessly about AI in maritime.</p>', false, false],
    ['call-only: dollar figure', '<p>It costs $450 a month.</p>', true, false],
    ['call-only: euro figure', '<p>The pilot is €15k.</p>', true, false],
    ['dead host verify.', '<p>Check it at verify.celeste7.ai today.</p>', true, false],
    ['live host verifier. ok (no \\bAI\\b false-positive)', '<p>Independently verifiable at verifier.celeste7.ai.</p>', false, false],
    ['bare celeste7.ai ok (no \\bAI\\b false-positive)', '<p>Visit celeste7.ai for details.</p>', false, false],
    ['internal code name .tsx', '<p>See HandoverDraftPanel.tsx for details.</p>', true, false],
    ['unbound asset placeholder', '<p>{{asset:does-not-exist}}</p>', true, false],
    ['bound asset placeholder ok', '<p>{{asset:handover-draft}}</p>', false, false],
    ['structure: two h1', '<h1>One</h1><h1>Two</h1>', true, false],
    ['full page missing canonical', '<html><head><title>A perfectly fine length title here ok</title></head><body><h1>x</h1></body></html>', true, true],
    // ── v2 additions (spec 29) ──
    ['v2 normalise: <em> split "writes <em>itself</em>"', '<p>The handover writes <em>itself</em>.</p>', true, false],
    ['v2 normalise: entity "writes&nbsp;itself"', '<p>The handover writes&nbsp;itself.</p>', true, false],
    ['v2 normalise: curly apostrophe "the moment it’s written"', '<p>Searchable the moment it’s written.</p>', true, false],
    ['v2 U20 support speed: "hours, not days"', '<p>Support response in hours, not days.</p>', true, false],
    ['v2 U28 money: "twenty thousand dollars"', '<p>A denied claim can cost twenty thousand dollars.</p>', true, false],
    ['v2 K03 narrowed: "Per vessel, not per user" passes', '<p>Per vessel, not per user. Unlimited seats.</p>', false, false],
    ['v2 negated on blog → warn only: "Nothing writes itself"', '<p>Nothing writes itself. Captured as you work.</p>', false, false],
    ['v2 data-pricing in a blog draft is NOT exempt (site pages only)', '<div data-pricing>USD 995 per vessel per month.</div>', true, false],
    ['v2 JSON-LD strings are copy', '<html><head><script type="application/ld+json">{"@graph":[{"description":"The handover writes itself."}]}</script></head><body></body></html>', true, true],
  ];
  for (const [label, body, expectFail, fullPage] of fixtures) {
    const v = checkText(body, { fullPage, pack });
    // full-page fixtures other than the canonical one score content only (they are not complete pages)
    const contentFail = v.some(x => x.sev === 'FAIL' && (!fullPage || /canonical/.test(label) || x.rule !== 'structure'));
    ok(contentFail === expectFail, label, contentFail === expectFail ? '' : `expected ${expectFail ? 'a violation' : 'clean'}; got ${v.map(x => `${x.sev} ${x.rule}: "${x.quote}"`).join(' | ') || 'clean'}`);
  }

  console.log('\n  ── contract fixtures ──');
  const PASS_FIXTURE = `<!doctype html>
<html lang="en"><head>
<title>Chief Engineer Handover Checklist for Superyachts — Celeste</title>
<meta name="description" content="The seven domains a proper chief engineer handover covers, and the engine room steps most yachts get wrong.">
<link rel="canonical" href="https://celeste7.ai/blogs/engineering-handover-superyacht">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BlogPosting","headline":"Chief Engineer Handover Checklist"}]}</script>
</head><body>
<h1>The Chief Engineer Handover Checklist Most Yachts Don't Have</h1>
<p>Captured as you work. Both signatures timestamped. Locked after dual signature.</p>
<p>Every record is independently verifiable at verifier.celeste7.ai.</p>
{{asset:handover-draft}}
</body></html>`;
  const FAIL_FIXTURE = `<p>If this describes your vessel, the handover writes itself.</p>
<p>Plans from $450 a month.</p>
<p>Verify your receipt at verify.celeste7.ai.</p>
<p>{{asset:does-not-exist}}</p>`;
  const passFails = checkText(PASS_FIXTURE, { fullPage: true, pack }).filter(x => x.sev === 'FAIL');
  ok(passFails.length === 0, 'contract PASS-fixture is clean', passFails.map(x => `${x.rule}: "${x.quote}"`).join(' | '));
  const failV = checkText(FAIL_FIXTURE, { fullPage: false, pack });
  for (const [name, pred] of [
    ['"the handover writes itself"', v => /writes itself/i.test(v.quote)],
    ['"$450" pricing (call-only)', v => v.rule.startsWith('call-only') && /\$/.test(v.quote)],
    ['verify.celeste7.ai dead host', v => /verify\.celeste7\.ai/i.test(v.quote)],
    ['unbound {{asset:does-not-exist}}', v => /asset:does-not-exist/i.test(v.quote)],
  ]) ok(failV.some(v => v.sev === 'FAIL' && pred(v)), `contract FAIL-fixture catches ${name}`);

  console.log('\n  ── v2: data-pricing on site pages (FD2) ──');
  const sp = (h, site) => checkText(h, { pack, site }).filter(x => x.sev === 'FAIL').length;
  ok(sp('<div class="pm" data-pricing><h2>$995</h2><div class="sub">per vessel per month</div></div>', true) === 0, 'site page: exact commercial.C01 inside data-pricing (nested markup) is allowed');
  ok(sp('<div class="pm" data-pricing><h2>$995</h2><div class="sub">per vessel per month</div></div><p>From $450.</p>', true) > 0, 'site page: a price outside the data-pricing element still fails');
  ok(sp('<div data-pricing>USD 450 per month, pilot only.</div>', true) > 0, 'site page: non-approved text inside data-pricing still fails');
  ok(sp('<div data-pricing>USD 995 per vessel per month.</div>', false) > 0, 'blog post / draft: data-pricing gives no exemption');

  console.log('\n  ── v2: normaliser bypasses and negation ──');
  for (const [t, exp] of [['The handover writes <span>it</span>self.', 'fail'], ['The handover writes it-self.', 'fail'], ['The handover writ\u0435s its\u0435lf.', 'fail'],
    ['A.I.-powered search.', 'fail'], ['995 USD per vessel.', 'fail'], ['Priced at 995/month per vessel.', 'fail'], ['Try it free for a month.', 'fail'],
    ["There's no doubt the handover writes itself.", 'fail'], ["We don't claim the handover writes itself.", 'warn'], ['For how long has the alarm been sounding?', 'pass'],
    ['Clear your inbox before the guests board.', 'pass'], ['We create a shared folder for each refit.', 'pass'], ['Spend real time with the crew.', 'pass']]) {
    const r = checkArtifact({ channel: 'blog', fields: { body: t }, claim_provenance: { claims: [] } }, { pack, skip: ['CC05'] });
    ok(r.verdict === exp, `blog: ${JSON.stringify(t)} → ${exp}`, `got ${r.verdict} ${r.violations.map(v => v.rule_id).join(',')}`);
  }

  console.log('\n  ── v2: structure fixes (G9 / G10) ──');
  const fx = readFileSync(join(HERE, 'tests', 'claims', 'fixtures', 'page_meta_apostrophe_desc.html'), 'utf8');
  const fv = checkText(fx, { fullPage: true, pack });
  ok(!fv.some(x => /<title> is/.test(x.quote)), 'G9: title with &amp;/&middot; counted as rendered chars (62) → no title violation', fv.map(x => x.quote).join(' | '));
  ok(fv.some(x => /meta description is 178 chars/.test(x.quote)), 'G10: meta description read past the apostrophe (178 > 155) → violation', fv.map(x => x.quote).join(' | '));

  console.log('\n  ── v2: channels, verdicts, determinism ──');
  const neg = t => checkArtifact({ channel: 'blog', fields: { body: t }, claim_provenance: { claims: [] } }, { pack, skip: ['CC05'] });
  ok(neg('Nothing claims to write itself.').verdict === 'warn', 'FD-29d: negated banned phrase on blog → verdict warn');
  ok(checkArtifact({ channel: 'linkedin', fields: { post_text: 'Nothing claims to write itself.' }, claim_provenance: { claims: [] } }, { pack, skip: ['CC05'] }).verdict === 'fail', 'FD-29d: same phrase on linkedin → fail');
  const c01 = ch => checkArtifact({ channel: ch, fields: { body: 'USD 995 per vessel per month.' }, claim_provenance: { claims: [{ claim_id: 'c1', text: 'USD 995 per vessel per month.', kind: 'pricing', location: { field: '/body' }, support: { type: 'brand_pack', ref: 'commercial.C01' } }] } }, { pack });
  ok(c01('email').checks.find(c => c.id === 'CC03').result === 'pass' && c01('email').checks.find(c => c.id === 'CC06').result === 'pass', 'commercial.C01 with provenance on email → CC03/CC06 pass');
  ok(c01('google_ads').checks.find(c => c.id === 'CC06').result === 'fail', 'commercial.C01 on google_ads → CC06 wrong_channel');
  const r1 = JSON.stringify(c01('email')), r2 = JSON.stringify(c01('email'));
  ok(r1 === r2, 'determinism: same input + pack → identical bytes');
  ok(checkArtifact({ channel: 'tiktok', fields: { body: 'x' } }, { pack }).verdict === 'insufficient_evidence', 'unknown channel → insufficient_evidence (abstain)');
  ok(checkArtifact({ channel: 'meta', fields: { headline: 'Captured as you work, every single day' }, claim_provenance: { claims: [] } }, { pack }).limits.some(l => l.field === '/headline'), 'CC07: meta headline > 27 chars → limit violation');

  console.log('\n  ── v2: pack sync (gen-claims --check) ──');
  const g = spawnSync(process.execPath, [join(HERE, 'gen-claims.mjs'), '--check'], { encoding: 'utf8' });
  ok(g.status === 0, 'gen-claims --check exits 0 on the committed pack', (g.stdout + g.stderr).trim());
  const tmp = mkdtempSync(join(tmpdir(), 'claims-sync-'));
  try {
    const md = readFileSync(join(HERE, 'claims-allowlist.md'), 'utf8');
    writeFileSync(join(tmp, 'claims-allowlist.md'), md.replace('"Captured as you work."', '"Captured as you work!"'));
    writeFileSync(join(tmp, 'claims.json'), readFileSync(join(HERE, 'lib', 'claims.json')));
    copyFileSync(join(HERE, 'lib', 'claims.json.sha256'), join(tmp, 'claims.json.sha256'));
    let threw = '';
    try { loadPack({ jsonPath: join(tmp, 'claims.json'), mdPath: join(tmp, 'claims-allowlist.md') }); } catch (e) { threw = e.name; }
    ok(threw === 'PackIntegrityError', 'one-character md edit without regenerating → pack refuses to load (fail-closed)');
    writeFileSync(join(tmp, 'claims.json'), readFileSync(join(HERE, 'lib', 'claims.json'), 'utf8').replace('"Captured as you work."', '"Captured as you work!"'));
    threw = '';
    try { loadPack({ jsonPath: join(tmp, 'claims.json'), mdPath: null }); } catch (e) { threw = e.name; }
    ok(threw === 'PackIntegrityError', 'hand-edited claims.json (sha mismatch) → pack refuses to load');
  } finally { rmSync(tmp, { recursive: true, force: true }); }

  console.log('\n  ── v2: --blind interface (synthetic TSV) ──');
  const b = spawnSync(process.execPath, [join(HERE, 'gate.mjs'), '--blind', join(HERE, 'tests', 'claims', 'blind_interface_synthetic.tsv')], { encoding: 'utf8' });
  const lines = b.stdout.trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } });
  const exp = readFileSync(join(HERE, 'tests', 'claims', 'blind_interface_synthetic.tsv'), 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
  ok(b.status === 0, '--blind exits 0', b.stderr);
  ok(lines.length === exp.length && lines.every(Boolean), `--blind prints one JSON line per case (${lines.length}/${exp.length})`);
  ok(lines.every(l => l && Object.keys(l).join(',') === 'case_id,verdict,rule_ids' && ['pass', 'warn', 'fail'].includes(l.verdict) && Array.isArray(l.rule_ids)), '--blind line shape {case_id, verdict, rule_ids}');
  const byId = Object.fromEntries(lines.filter(Boolean).map(l => [l.case_id, l]));
  for (const [id, rid, , , expect] of exp) {
    const got = byId[id];
    ok(got && got.verdict === expect && (expect === 'pass' || got.rule_ids.includes(rid)), `--blind ${id}: expect ${expect}${expect === 'pass' ? '' : ` (${rid})`}`, got ? JSON.stringify(got) : 'missing');
  }

  console.log(`\nself-test: ${pass} passed, ${fail} failed`);
  return fail === 0 ? 0 : 1;
}

// ─── entry ────────────────────────────────────────────────────────────────
function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (['--channel', '--artifact', '--blind'].includes(a)) o[a.slice(2)] = argv[++i];
    else if (a.startsWith('--')) o[a.slice(2)] = true;
    else o._.push(a);
  }
  return o;
}

const USAGE = 'usage: node gate.mjs <file|posts/slug-dir> [--site] [--channel <c>] [--json] | --artifact <input.json> | --blind <cases.tsv> | --pack-info | --self-test';
const a = args(process.argv.slice(2));

if (a['self-test']) {
  const pack = getPack(); if (!pack) process.exit(1);
  process.exit(selfTest(pack));
}
if (a['pack-info']) {
  const pack = getPack(); if (!pack) process.exit(1);
  console.log(JSON.stringify({ id: pack.id, version: pack.version, sha256: pack.sha256 }));
  process.exit(0);
}
if (a.blind) {
  // raw --blind always exits 0; problems go to stderr
  const note = m => console.error(`gate --blind: ${m}`);
  let text = '';
  if (a.blind === true) note('no TSV path given');
  else { try { text = readFileSync(resolve(a.blind), 'utf8'); } catch (e) { note(`cannot read ${a.blind}: ${e.message}`); } }
  let pack = null;
  try { pack = loadPack(); } catch (e) { note(`claims pack: ${e.message}`); }
  for (const l of blindLines(text, pack, note)) console.log(l);
  process.exit(0);
}
if (a.artifact) {
  let input;
  try { input = JSON.parse(readFileSync(resolve(a.artifact), 'utf8')); } catch (e) { console.error(`gate --artifact: ${e.message}`); process.exit(2); }
  if (a.channel && a.channel !== true) input.channel = a.channel;
  const res = checkArtifact(input);                 // pack integrity failure → CC12 insufficient_evidence → exit 3
  console.log(JSON.stringify(res, null, 2));
  process.exit(exitCodeFor(res));
}
if (!a._[0]) { console.error(USAGE); process.exit(2); }
const channel = a.channel && a.channel !== true ? a.channel : 'blog';
if (!CHANNELS.includes(channel)) { console.error(`gate: unknown channel ${channel}. ${USAGE}`); process.exit(2); }
const pack = getPack();
if (!pack) process.exit(a.json ? 3 : 1);
const parts = loadTarget(a._[0]);
if (!parts) process.exit(2);

if (a.json || channel !== 'blog') {
  const fields = Object.fromEntries(parts.map(p => [channel === 'blog' ? p.field : (p.field === 'meta_json' ? 'meta_json' : 'body'), p.text]));
  const res = checkArtifact({ channel, fields }, { pack, site: !!a.site, legacy: channel === 'blog', skip: channel === 'blog' ? [] : ['CC05', 'CC06', 'CC07'] });
  if (a.json) { console.log(JSON.stringify(res, null, 2)); process.exit(exitCodeFor(res)); }
  const fails = report(parts.map(p => p.name).join(' + '), legacyView(res, pack));
  console.log(fails ? `\ngate: FAIL — ${fails} blocking violation(s).` : '\ngate: PASS — no blocking violations.');
  process.exit(fails ? 1 : 0);
}
let totalFails = 0;
for (const t of parts) totalFails += report(t.name, checkText(t.text, { pack, field: t.field, site: !!a.site }));
if (totalFails === 0) { console.log('\ngate: PASS — no blocking violations.'); process.exit(0); }
console.log(`\ngate: FAIL — ${totalFails} blocking violation(s).`);
process.exit(1);
