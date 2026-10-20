#!/usr/bin/env node
// gate.mjs — the enforceable truth + brand firewall.
// Every draft passes this before it can be published. Node stdlib only.
//
//   node gate.mjs <file>          check one draft (draft.html, a full page, or a posts/<slug> dir)
//   node gate.mjs --self-test     run the built-in PASS/FAIL fixtures
//
// Exit 0 = clean. Exit 1 = at least one violation (or a failed self-test).
//
// It reads lib/claims.json (the parsed truth gate) and lib/assets.json (the
// placeholder resolver) and fails on:
//   - banned lexicon / banned overclaim / call-only regex matches (in product-claim context)
//   - structural defects: missing canonical (full pages), >1 <h1>, bad <title> length,
//     long meta description, missing JSON-LD, the dead host verify.celeste7.ai,
//     internal code/file names, and unbound {{asset:}} placeholders.
// Each violation prints with a line number and, when known, the safe substitute.

import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const claims = JSON.parse(readFileSync(join(HERE, 'lib', 'claims.json'), 'utf8'));
let assets = [];
try { assets = JSON.parse(readFileSync(join(HERE, 'lib', 'assets.json'), 'utf8')); } catch { /* optional */ }
const ASSET_IDS = new Set(assets.map(a => a.id));

// ─── colour-free severity tags (terminal-portable) ───
const FAIL = 'FAIL';
const WARN = 'WARN'; // editorial AI/topic flag — surfaces for human review, does not fail

// ─── helpers ──────────────────────────────────────────────────────────────

// Map a character offset back to a 1-based line number.
function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === '\n') line++;
  return line;
}

// The product-claim safe-substitute lookup: flatten every chapter's banned table
// into { lowercased-fragment-of-pattern -> safe }. Used to suggest a fix when a
// raw lexicon/overclaim string is matched. Best-effort; null when unknown.
function buildSafeIndex() {
  const idx = [];
  for (const ch of Object.values(claims.chapters || {})) {
    for (const b of ch.banned || []) {
      // strip the human-readable pattern down to quoted fragments
      const frags = (b.pattern.match(/"([^"]+)"/g) || []).map(s => s.replace(/"/g, '').toLowerCase());
      for (const f of frags) idx.push({ frag: f, safe: b.safe });
      // also key on bare lexis like cascade/propagate/auto for fuzzy hits
    }
  }
  return idx;
}
const SAFE_INDEX = buildSafeIndex();

function suggestSafe(matchText) {
  const m = matchText.toLowerCase();
  for (const { frag, safe } of SAFE_INDEX) {
    if (frag.length > 3 && (frag.includes(m) || m.includes(frag.split(' ')[0]))) return safe;
  }
  return null;
}

// Editorial context: a line is "editorial" (not a product claim) when it is
// inside a passage explicitly discussing the topic, marked with data-editorial
// or a comment <!-- editorial -->. The AI lexicon token alone is WARN there,
// not FAIL. Everything else (overclaims, call-only, other lexicon) always FAILs.
function isEditorialLine(line) {
  return /data-editorial|<!--\s*editorial/i.test(line);
}

// ─── the core check ───────────────────────────────────────────────────────

function checkText(text, { fullPage }) {
  const violations = [];
  const add = (sev, line, rule, quote, safe) =>
    violations.push({ sev, line, rule, quote: quote.slice(0, 80), safe });

  // 1. Banned lexicon (product-magic words). The AI/ML/intelligent family gets an
  //    editorial exception → WARN; the rest are hard FAIL anywhere they appear.
  const editorialTokens = /\\bAI\\b|artificial intelligence|machine|\\bML\\b|\\bintelligent\\b/;
  for (const rx of claims.banned_lexicon) {
    const re = new RegExp(rx, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
      // URL/TLD/file-extension guard: a bare-acronym token (AI, ML) immediately
      // preceded by "." is a domain or extension fragment — celeste7.ai,
      // verifier.celeste7.ai, foo.ml — NOT the product-magic acronym. The
      // approved host verifier.celeste7.ai must never trip the gate, or the gate
      // becomes unfixable (its own safe substitute would fail). Skip those.
      const prevChar = m.index > 0 ? text[m.index - 1] : '';
      if (prevChar === '.' && /^(ai|ml)$/i.test(m[0])) {
        if (m.index === re.lastIndex) re.lastIndex++;
        continue;
      }
      const line = lineOf(text, m.index);
      const lineText = text.split('\n')[line - 1] || '';
      const editorialToken = editorialTokens.test(rx);
      const sev = editorialToken && isEditorialLine(lineText) ? WARN : FAIL;
      add(sev, line, `banned lexicon /${rx}/`, m[0], suggestSafe(m[0]));
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }

  // 2. Banned overclaims — always hard FAIL, no editorial exception.
  for (const rx of claims.banned_overclaims) {
    const re = new RegExp(rx, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
      add(FAIL, lineOf(text, m.index), `banned overclaim /${rx}/`, m[0], suggestSafe(m[0]));
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }

  // 3. Call-only (pricing) — always hard FAIL in published copy.
  for (const rx of claims.call_only) {
    const re = new RegExp(rx, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
      add(FAIL, lineOf(text, m.index), `call-only /${rx}/`, m[0], 'pricing is CALL-ONLY — remove from published copy');
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }

  // 4. Dead host (explicit, beyond the lexicon list for a clear message).
  {
    const re = /verify\.celeste7\.ai/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      add(FAIL, lineOf(text, m.index), 'dead host', m[0], 'verifier.celeste7.ai');
    }
  }

  // 5. Internal code / file names must never reach buyer copy.
  const codeNames = [
    /HandoverDraftPanel/g, /ConfirmExportModal/g, /executeAction\s*\(/g,
    /\b\w+\.tsx\b/g, /POST\s+\/v1\//g, /combined_service/g, /f1_search_cards/g,
  ];
  for (const re of codeNames) {
    let m;
    while ((m = re.exec(text)) !== null) {
      add(FAIL, lineOf(text, m.index), 'internal code/file name', m[0], 'remove — internal names never appear in buyer copy');
    }
  }

  // 6. Unbound {{asset:id}} placeholders.
  {
    const re = /\{\{\s*asset:\s*([a-z0-9-]+)\s*\}\}/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const id = m[1];
      if (!ASSET_IDS.has(id)) {
        add(FAIL, lineOf(text, m.index), 'unbound asset placeholder', m[0],
          `unknown asset id "${id}" — must exist in lib/assets.json`);
      }
    }
  }

  // 7. Structural checks.
  const h1Count = (text.match(/<h1[\s>]/gi) || []).length;
  if (fullPage && h1Count === 0) add(FAIL, 1, 'structure', 'no <h1>', 'a page needs exactly one <h1>');
  if (h1Count > 1) add(FAIL, 1, 'structure', `${h1Count} <h1> elements`, 'exactly one <h1> per page');

  if (fullPage) {
    if (!/<link[^>]+rel=["']?canonical/i.test(text))
      add(FAIL, 1, 'structure', 'missing <link rel="canonical">', 'add canonical URL');

    const title = (text.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
    if (!title) add(FAIL, 1, 'structure', 'missing <title>', 'add a 30–65 char <title>');
    else {
      const len = title.trim().length;
      if (len < 30 || len > 65)
        add(FAIL, 1, 'structure', `<title> is ${len} chars`, '<title> must be 30–65 chars');
    }

    const desc = (text.match(/<meta[^>]+name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) || [])[1];
    if (!desc) add(FAIL, 1, 'structure', 'missing meta description', 'add a meta description ≤155 chars');
    else if (desc.length > 155)
      add(FAIL, 1, 'structure', `meta description is ${desc.length} chars`, 'meta description must be ≤155 chars');

    if (!/application\/ld\+json/i.test(text))
      add(FAIL, 1, 'structure', 'no JSON-LD', 'add structured data (Article / FAQPage)');
    else {
      // Exactly one block, valid JSON, one @graph, and every {"@id"} reference resolves
      // (defined in the graph, or a canonical site entity defined on the homepage).
      const blocks = [...text.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
      if (blocks.length !== 1) add(FAIL, 1, 'jsonld', `${blocks.length} JSON-LD blocks`, 'exactly one ld+json block with one @graph');
      else try {
        const ld = JSON.parse(blocks[0][1]);
        const nodes = ld['@graph'];
        if (!Array.isArray(nodes)) add(FAIL, 1, 'jsonld', 'JSON-LD has no @graph', 'wrap nodes in one @graph');
        else {
          const SITE = new Set(['organization', 'website', 'logo', 'founder', 'software', 'pilot'].map(k => `https://celeste7.ai/#${k}`));
          const defined = new Set(), refs = [];
          (function walk(v) { if (v && typeof v === 'object') {
            if (v['@id']) (Object.keys(v).length === 1 ? refs.push(v['@id']) : defined.add(v['@id']));
            Object.values(v).forEach(walk); } })(nodes);
          for (const r of refs) if (!defined.has(r) && !SITE.has(r)) add(FAIL, 1, 'jsonld', `unresolved @id ${r}`, 'define it in the @graph');
          if (nodes.filter(n => n['@type'] === 'BreadcrumbList').length > 1) add(FAIL, 1, 'jsonld', 'duplicate BreadcrumbList', 'one breadcrumb per page');
        }
      } catch (e) { add(FAIL, 1, 'jsonld', `JSON-LD does not parse: ${e.message}`, 'fix the JSON'); }
    }
  }

  return violations;
}

// Resolve a target path into the text(s) to check + whether it is a full page.
function loadTarget(target) {
  const p = resolve(target);
  if (!existsSync(p)) { console.error(`gate: not found: ${p}`); process.exit(2); }
  if (statSync(p).isDirectory()) {
    // A posts/<slug> dir: gate draft.html (body) + meta.json text together.
    const draft = join(p, 'draft.html');
    const meta = join(p, 'meta.json');
    if (!existsSync(draft)) { console.error(`gate: ${draft} missing`); process.exit(2); }
    let text = readFileSync(draft, 'utf8');
    let metaText = existsSync(meta) ? readFileSync(meta, 'utf8') : '';
    return [
      { name: draft, text, fullPage: false },
      ...(metaText ? [{ name: meta, text: metaText, fullPage: false }] : []),
    ];
  }
  const text = readFileSync(p, 'utf8');
  // A file is a "full page" when it has <html> / <head> — body-only drafts are not.
  const fullPage = /<html[\s>]/i.test(text) || /<head[\s>]/i.test(text);
  return [{ name: p, text, fullPage }];
}

function report(name, violations) {
  const fails = violations.filter(v => v.sev === FAIL);
  const warns = violations.filter(v => v.sev === WARN);
  if (!violations.length) { console.log(`PASS  ${name} — clean`); return 0; }
  console.log(`\n${name}`);
  for (const v of [...fails, ...warns].sort((a, b) => a.line - b.line)) {
    const tag = v.sev === FAIL ? 'FAIL' : 'warn';
    let msg = `  ${tag}  L${v.line}  ${v.rule}: "${v.quote}"`;
    if (v.safe) msg += `\n        → safe: ${v.safe}`;
    console.log(msg);
  }
  return fails.length;
}

// ─── self-test ──────────────────────────────────────────────────────────────

function selfTest() {
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
  ];
  let pass = 0, fail = 0;
  for (const [label, body, expectFail, fullPage] of fixtures) {
    const v = checkText(body, { fullPage });
    const hasFail = v.some(x => x.sev === FAIL);
    const ok = hasFail === expectFail;
    if (ok) { pass++; console.log(`  PASS  ${label}`); }
    else {
      fail++;
      console.log(`  FAIL  ${label} — expected ${expectFail ? 'a violation' : 'clean'}, got ${hasFail ? 'a violation' : 'clean'}`);
      for (const x of v) console.log(`          (${x.sev} ${x.rule}: "${x.quote}")`);
    }
  }

  // ── Contract-mandated PASS/FAIL fixtures ───────────────────────────────
  // One clean PASSING fixture (safe phrasings, valid structure, bound asset)
  // must produce zero violations. One FAILING fixture must catch all of:
  //   "the handover writes itself", "$450", "verify.celeste7.ai", {{asset:x}}.
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

  // PASS fixture: must be clean.
  const passV = checkText(PASS_FIXTURE, { fullPage: true });
  const passFails = passV.filter(x => x.sev === FAIL);
  if (passFails.length === 0) { pass++; console.log('  PASS  contract PASS-fixture is clean'); }
  else {
    fail++;
    console.log('  FAIL  contract PASS-fixture should be clean but has violations:');
    for (const x of passFails) console.log(`          (${x.rule}: "${x.quote}")`);
  }

  // FAIL fixture: must catch each of the four named violations.
  const failV = checkText(FAIL_FIXTURE, { fullPage: false });
  const expectations = [
    ['"the handover writes itself"', v => /writes itself/i.test(v.quote)],
    ['"$450" pricing (call-only)',  v => v.rule.startsWith('call-only') && /\$/.test(v.quote)],
    ['verify.celeste7.ai dead host', v => /verify\.celeste7\.ai/i.test(v.quote)],
    ['unbound {{asset:does-not-exist}}', v => /asset:does-not-exist/i.test(v.quote)],
  ];
  for (const [name, pred] of expectations) {
    const hit = failV.some(v => v.sev === FAIL && pred(v));
    if (hit) { pass++; console.log(`  PASS  contract FAIL-fixture catches ${name}`); }
    else { fail++; console.log(`  FAIL  contract FAIL-fixture missed ${name}`); }
  }

  console.log(`\nself-test: ${pass} passed, ${fail} failed`);
  return fail === 0 ? 0 : 1;
}

// ─── entry ────────────────────────────────────────────────────────────────

const arg = process.argv[2];
if (!arg) {
  console.error('usage: node gate.mjs <file|posts/slug-dir> | --self-test');
  process.exit(2);
}
if (arg === '--self-test') {
  process.exit(selfTest());
}

const targets = loadTarget(arg);
let totalFails = 0;
for (const t of targets) totalFails += report(t.name, checkText(t.text, { fullPage: t.fullPage }));
if (totalFails === 0) { console.log('\ngate: PASS — no blocking violations.'); process.exit(0); }
console.log(`\ngate: FAIL — ${totalFails} blocking violation(s).`);
process.exit(1);
