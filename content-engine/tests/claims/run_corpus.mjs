#!/usr/bin/env node
// run_corpus.mjs — claims-gate acceptance harness. Node stdlib only, $0, no network.
// Vendored from CONTROL/AUDIT_WORKING/control01/claims_tests (spec 29 §4). Corpus files are unchanged.
//
//   node content-engine/tests/claims/run_corpus.mjs
//       Target mode against this repo's content-engine/lib/claims-check.mjs (the default --lib).
//   node content-engine/tests/claims/run_corpus.mjs --blind <path/to/blind.tsv>
//       Held-out set (spec 29 §4.3 item 2). Runs `node content-engine/gate.mjs --blind <tsv>` and scores it:
//       rows expecting block must FAIL (bar: >= 95%), rows expecting pass must not FAIL (bar: 0 false blocks),
//       rows expecting warn must WARN. Exit 0 only if both bars are met. The set is supplied by CONTROL01
//       and is never committed here.
//
//   node run_corpus.mjs --gate <path/to/content-engine/gate.mjs> --tmp <scratch dir> [--out results.json]
//       Baseline mode: runs the CURRENT channel-blind CLI once per case (exit 1 = blocked).
//   node run_corpus.mjs --lib <path/to/content-engine/lib/claims-check.mjs> [--out results.json]
//       Target mode: imports checkArtifact() and runs every case on its channel.
//       A case counts as blocked only if a claims check fails (CC01-CC06). Length/format (CC07+) is
//       reported separately and never counts. Banned rows without claim_id skip CC05 so a block must come
//       from the banned/call-only/channel rules. Rows with claim_id carry claim_provenance (support.ref = claim_id).
//
// Acceptance (spec 29 §4): banned blocked = 100%; approved blocked = 0; homepage_meta matches `expect`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith('--') ? a.concat([[v.slice(2), all[i + 1]]]) : a), []));
const tsv = f => { const [h, ...rows] = readFileSync(join(HERE, f), 'utf8').trimEnd().split('\n');
  const cols = h.split('\t'); return rows.map(r => Object.fromEntries(r.split('\t').map((v, i) => [cols[i], v.replace(/\\n/g, '\n')]))); };
const sets = { banned: tsv('banned.tsv'), approved: tsv('approved.tsv'), homepage_meta: tsv('homepage_meta.tsv') };

if (args.blind) {
  const gate = resolve(HERE, '..', '..', 'gate.mjs');
  const r = spawnSync(process.execPath, [gate, '--blind', resolve(args.blind)], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (r.status !== 0) { console.error(r.stderr || `gate --blind exited ${r.status}`); process.exit(2); }
  const got = Object.fromEntries(r.stdout.trim().split('\n').filter(Boolean).map(l => JSON.parse(l)).map(o => [o.case_id, o]));
  if (r.stderr.trim()) console.error(r.stderr.trim());
  const [h, ...rows] = readFileSync(resolve(args.blind), 'utf8').replace(/^\uFEFF/, '').replace(/\r/g, '').trimEnd().split('\n').filter(l => l.trim());
  const cols = h.split('\t').map(c => c.trim().toLowerCase());
  const cases = rows.map(x => Object.fromEntries(x.split('\t').map((v, i) => [cols[i], v])));
  const WANT = { block: 'block', blocked: 'block', fail: 'block', banned: 'block', deny: 'block', pass: 'pass', allow: 'pass', allowed: 'pass', ok: 'pass', clean: 'pass', approved: 'pass', warn: 'warn', warning: 'warn' };
  const bad = cases.filter(c => !WANT[String(c.expect || '').trim().toLowerCase()]);
  if (bad.length) { console.error(`run_corpus --blind: unknown expect value(s): ${[...new Set(bad.map(c => c.expect))].join(', ')} (use block|pass|warn)`); process.exit(2); }
  const want = c => WANT[String(c.expect).trim().toLowerCase()];
  const blk = cases.filter(c => want(c) === 'block'), pas = cases.filter(c => want(c) === 'pass'), wrn = cases.filter(c => want(c) === 'warn');
  const blocked = blk.filter(c => got[c.case_id]?.verdict === 'fail');
  const falseBlocks = pas.filter(c => got[c.case_id]?.verdict === 'fail');
  const warnOk = wrn.filter(c => got[c.case_id]?.verdict === 'warn');
  const missing = cases.filter(c => !got[c.case_id]);
  const rate = blk.length ? blocked.length / blk.length : 1;
  const ok = rate >= 0.95 && falseBlocks.length === 0 && warnOk.length === wrn.length && missing.length === 0;
  const summary = { blind: { pass_bar: ok, total: cases.length, expect_block: blk.length, blocked: blocked.length, rate: Math.round(rate * 10000) / 100,
    expect_pass: pas.length, false_blocks: falseBlocks.length, expect_warn: wrn.length, warn_ok: warnOk.length, missing: missing.map(c => c.case_id),
    missed: blk.filter(c => got[c.case_id]?.verdict !== 'fail').map(c => ({ case_id: c.case_id, rule_id: c.rule_id, verdict: got[c.case_id]?.verdict ?? 'missing' })),
    false_blocked: falseBlocks.map(c => ({ case_id: c.case_id, rule_ids: got[c.case_id].rule_ids })),
    warn_mismatch: wrn.filter(c => got[c.case_id]?.verdict !== 'warn').map(c => ({ case_id: c.case_id, verdict: got[c.case_id]?.verdict ?? 'missing' })) } };
  console.log(JSON.stringify(summary, null, 1));
  if (args.out) writeFileSync(resolve(args.out), JSON.stringify({ summary, cases: Object.values(got) }, null, 1));
  // exit 0 only when every bar is met: >= 95% blocked, 0 false blocks, every warn row warns, no missing case
  process.exit(ok ? 0 : 1);
}

if (!args.gate && !args.lib) args.lib = join(HERE, '..', '..', 'lib', 'claims-check.mjs');
let runOne;
if (args.gate) {
  const gate = resolve(args.gate), tmp = resolve(args.tmp || '/tmp/claims_corpus'); mkdirSync(tmp, { recursive: true });
  runOne = (c, i) => { const f = join(tmp, `case_${i}.txt`); writeFileSync(f, c.text);
    const r = spawnSync(process.execPath, [gate, f], { cwd: dirname(gate), encoding: 'utf8' });
    const rules = [...r.stdout.matchAll(/FAIL\s+L\d+\s+([^:]+):/g)].map(m => m[1]);
    return { blocked: r.status === 1, contentBlocked: r.status === 1, rules }; };
} else if (args.lib) {
  const lib = await import(pathToFileURL(resolve(args.lib)).href);
  runOne = c => { const field = c.field ? c.field.split('.')[1] : 'body';
    const prov = c.claim_id ? [{ claim_id: 'c1', text: c.text, kind: 'product_capability', location: { field: `/${field}` }, support: { type: 'brand_pack', ref: c.claim_id }, status: 'supported' }] : [];
    // approved commercial lines on email are 1:1 email lines (FD2/FD3), so email rows run as one_to_one
    const res = lib.checkArtifact({ channel: c.channel || 'page_meta', fields: { [field]: c.text }, claim_provenance: { claims: prov }, ...(c.channel === 'email' ? { email_type: 'one_to_one' } : {}) }, { skip: c.claim_id ? [] : ['CC05'] });
    const failed = res.checks.filter(k => k.result === 'fail').map(k => k.id);
    return { blocked: res.verdict === 'fail', contentBlocked: failed.some(id => ['CC01','CC02','CC03','CC04','CC05','CC06'].includes(id)), rules: failed }; };
} else { console.error('usage: [--lib <claims-check.mjs>] | --gate <gate.mjs> --tmp <dir> | --blind <tsv>'); process.exit(2); }

const out = { mode: args.gate ? 'baseline_cli' : 'target_lib', engine: args.gate ? args.gate : 'content-engine/lib/claims-check.mjs', summary: {}, cases: {} };   // no timestamp: byte-identical across runs
let i = 0;
for (const [name, rows] of Object.entries(sets)) {
  out.cases[name] = rows.map(c => ({ id: c.case_id, channel: c.channel || c.field, expect: c.expect, ...runOne(c, i++) }));
}
const b = out.cases.banned, a = out.cases.approved, h = out.cases.homepage_meta;
const fam = {}; for (const [k, c] of b.entries()) { const f = sets.banned[k].family; fam[f] ??= [0, 0]; fam[f][1]++; if (c.contentBlocked) fam[f][0]++; }
out.summary = {
  banned: { total: b.length, blocked: b.filter(c => c.contentBlocked).length },
  banned_rules: { total: new Set(sets.banned.map(r => r.rule_id)).size,
    fully_blocked: [...new Set(sets.banned.map(r => r.rule_id))].filter(id => b.every((c, k) => sets.banned[k].rule_id !== id || c.contentBlocked)).length },
  approved: { total: a.length, blocked: a.filter(c => c.contentBlocked).length,
    distinct_claims_blocked: [...new Set(a.filter(c => c.contentBlocked).map(c => c.id.split('@')[0]))] },
  homepage_meta: h.map(c => `${c.id}: expect ${c.expect}, got ${c.contentBlocked ? 'block' : 'pass'}`),
  by_family: fam,
};
console.log(JSON.stringify(out.summary, null, 1));
if (args.out) writeFileSync(resolve(args.out), JSON.stringify(out, null, 1));
const ok = out.summary.banned.blocked === b.length && out.summary.approved.blocked === 0 && h.every(c => (c.expect === 'block') === c.contentBlocked);
process.exit(ok ? 0 : 1);
