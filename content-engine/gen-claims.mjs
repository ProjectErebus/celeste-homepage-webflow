#!/usr/bin/env node
// gen-claims.mjs — claims-allowlist.md (human source of truth) → lib/claims.json + lib/claims.json.sha256
// Node stdlib only. Spec 29 §2.4. lib/claims.json is GENERATED — never hand-edit it.
//
//   node gen-claims.mjs            regenerate lib/claims.json and lib/claims.json.sha256
//   node gen-claims.mjs --check    regenerate in memory and byte-compare with disk; also validate the pack.
//                                  Exit 0 = in sync and valid. Exit 1 = drift or invalid (first problem printed).
//
// Grammar (claims-allowlist.md v2):
//   front matter      ---\npack_id: …\nversion: …\n---
//   chapter heading   ## <title> <!-- chapter: <slug> [legacy="<old chapters{} key>"] -->
//   approved line     - `<chapter>.<P|S|C|M><nn>` [B L E LI M G SG] "text"
//                       nested:  - variant: "…"   - short: "…"   - note: …   - ev: …
//   banned table      | id | Banned phrasing | Why | Safe substitute |   (chapter → legacy chapters{}.banned)
//   rule register     | id | check | family | why | safe |   (under a heading marked <!-- register: rules -->)
//   fenced blocks     ```rules  (ID /regex/flags [editorial] [domain_guard])
//                     ```lexicon ```overclaims ```call_only   (legacy keys, one /regex/ per line)
//                     ```synonyms (from => to) ```triggers (/regex/) ```internal_names (/regex/)
//                     ```json channels  ```json footers  ```json hosts
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const MD = join(HERE, 'claims-allowlist.md');
const JSON_PATH = join(HERE, 'lib', 'claims.json');
const SHA_PATH = JSON_PATH + '.sha256';
const sha256 = b => createHash('sha256').update(b).digest('hex');

const CH_CODES = { B: 'blog', L: 'page_meta', E: 'email', LI: 'linkedin', M: 'meta', G: 'google_ads', SG: 'social_generic' };
const CH_ORDER = ['blog', 'page_meta', 'email', 'linkedin', 'meta', 'google_ads', 'social_generic'];
const RX = /^\/((?:\\.|\[(?:\\.|[^\]\\])*\]|[^\\/\[])+)\/([imsu]*)(?=\s|$)/;   // /source/flags — '/' must be escaped outside classes

export function checkOfRule(id) {
  if (/^K\d+$/.test(id)) return 'CC03';
  if (['U03', 'U04', 'U36'].includes(id)) return 'CC01';
  if (id === 'U15') return 'CC04';
  return 'CC02';
}

function cells(line) { return line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|')); }
const unq = s => s.replace(/^"(.*)"$/, '$1');

export function parse(md) {
  const errors = [];
  const lines = md.split('\n');
  const out = { meta: {}, approved: [], rules: [], rule_register: {}, legacy: { lexicon: [], overclaims: [], call_only: [] },
    chapters: {}, synonyms: {}, triggers: [], internal_names: [], channels: {}, footers: {}, hosts: {} };
  let i = 0;
  if (lines[0] === '---') {
    for (i = 1; i < lines.length && lines[i] !== '---'; i++) { const m = lines[i].match(/^([a-z_]+):\s*(.*)$/); if (m) out.meta[m[1]] = m[2].trim(); }
    i++;
  }
  let chapter = null, legacyKey = null, section = null, register = false, fence = null, fenceBody = [], fenceStart = 0, lastApproved = null;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (fence) {
      if (/^```\s*$/.test(line)) { handleFence(fence, fenceBody, fenceStart); fence = null; fenceBody = []; continue; }
      fenceBody.push(line); continue;
    }
    const f = line.match(/^```\s*([a-z_ ]+?)\s*$/);
    if (f) { fence = f[1]; fenceStart = i + 1; continue; }
    if (/^```/.test(line)) { fence = '(plain)'; fenceStart = i + 1; continue; }
    const h2 = line.match(/^## (.*)$/);
    if (h2) {
      const cm = h2[1].match(/<!--\s*chapter:\s*([a-z_]+)(?:\s+legacy="([^"]+)")?\s*-->/);
      chapter = cm ? cm[1] : null; legacyKey = cm ? (cm[2] || null) : null; section = null; lastApproved = null;
      register = /<!--\s*register:\s*rules\s*-->/.test(h2[1]);
      if (legacyKey) out.chapters[legacyKey] = { safe: [], banned: [] };
      continue;
    }
    const h3 = line.match(/^### (.*)$/);
    if (h3) { section = /^SAFE/i.test(h3[1]) ? 'safe' : /^BANNED/i.test(h3[1]) ? 'banned' : 'other'; lastApproved = null; continue; }
    const ap = line.match(/^- `([a-z_]+\.(?:P|S|C|M)\d{2})` \[([A-Z ]+)\] "(.*)"\s*$/);
    if (ap) {
      if (!chapter) errors.push(`L${i + 1}: approved id outside a chapter`);
      const codes = ap[2].trim().split(/\s+/);
      const bad = codes.filter(c => !CH_CODES[c]);
      if (bad.length) errors.push(`L${i + 1}: unknown channel code(s) ${bad.join(',')}`);
      const chans = new Set(codes.map(c => CH_CODES[c]).filter(Boolean));
      if (chans.has('linkedin') && chans.has('meta')) chans.add('social_generic');   // §3.2: SG inherits LI+M ids
      lastApproved = { id: ap[1], chapter, channels: CH_ORDER.filter(c => chans.has(c)), text: ap[3], units: [], variants: [], short: [], ev: null, line: i + 1 };
      out.approved.push(lastApproved);
      if (legacyKey && section === 'safe') out.chapters[legacyKey].safe.push(ap[3]);
      continue;
    }
    const sub = line.match(/^\s{2,}- (variant|short|ev|note):\s*(.*)$/);
    if (sub && lastApproved) {
      if (sub[1] === 'variant') lastApproved.variants.push(unq(sub[2]));
      else if (sub[1] === 'short') lastApproved.short.push(unq(sub[2]));
      else if (sub[1] === 'ev') lastApproved.ev = sub[2];
      continue;
    }
    if (/^\|/.test(line) && !/^\|\s*-/.test(line)) {
      const c = cells(line);
      if (register) {
        if (c[0] === 'id') continue;
        if (c.length < 5) { errors.push(`L${i + 1}: rule register row needs 5 cells`); continue; }
        out.rule_register[c[0]] = { check: c[1], family: c[2], why: c[3], safe: c[4] };
      } else if (section === 'banned' && legacyKey) {
        if (c[0] === 'id') continue;
        if (c.length < 4) { errors.push(`L${i + 1}: banned row needs 4 cells (id | phrasing | why | safe)`); continue; }
        out.chapters[legacyKey].banned.push({ id: c[0], pattern: c[1], why: c[2], safe: c[3] });
      }
      continue;
    }
    if (lastApproved && line.trim() && !/^\s/.test(line)) lastApproved = null;
  }
  if (fence) errors.push(`L${fenceStart}: unterminated fence`);

  function handleFence(kind, body, start) {
    const rows = body.map((l, k) => [l, start + k + 1]).filter(([l]) => l.trim() && !/^\s*#/.test(l));
    if (kind === 'rules') for (const [l, n] of rows) {
      const m = l.match(/^([UK]\d{2})\s+(.*)$/);
      const r = m && m[2].match(RX);
      if (!m || !r) { errors.push(`L${n}: bad rule line: ${l}`); continue; }
      const flagsWords = m[2].slice(r[0].length).trim().split(/\s+/).filter(Boolean);
      for (const w of flagsWords) if (!['editorial', 'domain_guard'].includes(w)) errors.push(`L${n}: unknown rule option ${w}`);
      out.rules.push({ id: m[1], regex: r[1], flags: r[2], editorial: flagsWords.includes('editorial'), domain_guard: flagsWords.includes('domain_guard'), line: n });
    } else if (['lexicon', 'overclaims', 'call_only', 'triggers', 'internal_names'].includes(kind)) for (const [l, n] of rows) {
      const r = l.trim().match(RX);
      if (!r) { errors.push(`L${n}: bad ${kind} line: ${l}`); continue; }
      (kind === 'triggers' || kind === 'internal_names' ? out[kind] : out.legacy[kind]).push(r[1]);
    } else if (kind === 'synonyms') for (const [l, n] of rows) {
      const m = l.match(/^\s*(.+?)\s*=>\s*(.+?)\s*$/);
      if (!m) { errors.push(`L${n}: bad synonym line: ${l}`); continue; }
      out.synonyms[m[1].toLowerCase()] = m[2];
    } else if (/^json (channels|footers|hosts)$/.test(kind)) {
      try { out[kind.split(' ')[1]] = JSON.parse(body.join('\n')); } catch (e) { errors.push(`L${start}: ${kind}: ${e.message}`); }
    }
  }
  return { out, errors };
}

// Sentence units: split at ". " and "; " (spec §2.2 step 2).
const unitsOf = t => t.split(/(?<=[.;])\s+/).map(s => s.trim()).filter(Boolean);

function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])]));
  return v;
}

export function build(mdBytes, genBytes) {
  const md = mdBytes.toString('utf8');
  const { out, errors } = parse(md);
  // validation (spec §2.4 --check)
  const seen = new Set();
  for (const a of out.approved) {
    if (seen.has(a.id)) errors.push(`duplicate approved id ${a.id}`); seen.add(a.id);
    if (!a.channels.length) errors.push(`approved id ${a.id} has no channels`);
    if (a.id.split('.')[0] !== a.chapter) errors.push(`approved id ${a.id} is under chapter ${a.chapter}`);
  }
  const rules = [];
  for (const r of out.rules) {
    const reg = out.rule_register[r.id];
    if (!reg) { errors.push(`rule ${r.id} (L${r.line}) has no row in the rule register`); continue; }
    if (reg.check !== checkOfRule(r.id)) errors.push(`rule ${r.id}: register check ${reg.check} != ${checkOfRule(r.id)}`);
    try { new RegExp(r.regex, r.flags); } catch (e) { errors.push(`rule ${r.id} L${r.line}: regex does not compile: ${e.message}`); }
    if (/\.\*|\.\+/.test(r.regex)) errors.push(`rule ${r.id} L${r.line}: unbounded .* / .+ (use [a-z ]{0,30})`);
    rules.push({ id: r.id, check: reg.check, family: reg.family, regex: r.regex, flags: r.flags, why: reg.why, safe: reg.safe,
      ...(r.editorial ? { editorial: true } : {}), ...(r.domain_guard ? { domain_guard: true } : {}) });
  }
  for (const id of Object.keys(out.rule_register)) if (!out.rules.some(r => r.id === id)) errors.push(`rule register id ${id} has no regex`);
  for (const k of ['lexicon', 'overclaims', 'call_only']) for (const x of out.legacy[k]) { try { new RegExp(x); } catch (e) { errors.push(`legacy ${k} /${x}/: ${e.message}`); } }
  for (const k of ['pack_id', 'version']) if (!out.meta[k]) errors.push(`front matter: ${k} missing`);

  const json = sortKeys({
    meta: { schema: 'claims/2.0.0', pack_id: out.meta.pack_id, version: out.meta.version, source_path: 'content-engine/claims-allowlist.md',
      source_sha256: sha256(mdBytes), generator_sha256: sha256(genBytes) },
    // legacy keys (brief.mjs, older tooling)
    banned_lexicon: out.legacy.lexicon, banned_overclaims: out.legacy.overclaims, call_only: out.legacy.call_only, chapters: out.chapters,
    // v2 keys
    approved: out.approved.map(a => ({ id: a.id, chapter: a.chapter, channels: a.channels, text: a.text, units: unitsOf(a.text), variants: a.variants, short: a.short, ev: a.ev })),
    rules, synonyms: out.synonyms, claim_triggers: out.triggers, internal_names: out.internal_names,
    channels: out.channels, footers: out.footers, hosts: out.hosts,
  });
  const text = JSON.stringify(json, null, 2) + '\n';
  return { text, sha: sha256(Buffer.from(text, 'utf8')), json, errors };
}

// Self-consistency (spec §2.4): no approved text may trip a banned rule on one of its
// own channels. Call-only (K) hits are allowed only for commercial.C* ids (exempted via provenance).
async function selfConsistency(json) {
  const { compilePack, scanText } = await import('./lib/claims-check.mjs');
  const pack = compilePack(json, null);
  const errs = [];
  for (const a of json.approved) {
    for (const t of [a.text, ...a.variants, ...a.short]) {
      for (const ch of a.channels) {
        const { hits } = scanText(t, { channel: ch, pack, html: false });
        for (const h of hits) {
          if (h.check === 'CC03' && /^commercial\.C\d\d$/.test(a.id)) continue;
          errs.push(`approved ${a.id} on ${ch} trips ${h.rule_id} ("${h.match}"): "${t}"`);
        }
      }
    }
  }
  return [...new Set(errs)];
}

function firstDiff(a, b, path = '') {
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) return path || '/';
  if (a && typeof a === 'object') {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
    for (const k of keys) { if (!(k in a) || !(k in b)) return `${path}/${k}`; const d = firstDiff(a[k], b[k], `${path}/${k}`); if (d) return d; }
    return null;
  }
  return a === b ? null : path || '/';
}

export async function run({ check = false, mdPath = MD, jsonPath = JSON_PATH, log = console.log, err = console.error } = {}) {
  const mdBytes = readFileSync(mdPath);
  const genBytes = readFileSync(fileURLToPath(import.meta.url));
  const { text, sha, json, errors } = build(mdBytes, genBytes);
  if (!errors.length) errors.push(...await selfConsistency(json));
  if (errors.length) { err(`gen-claims: ${errors.length} problem(s) in ${relative(process.cwd(), mdPath) || mdPath}:`); for (const e of errors.slice(0, 40)) err('  · ' + e); return 1; }
  if (check) {
    let disk = null, diskSha = null;
    try { disk = readFileSync(jsonPath, 'utf8'); } catch { /* missing */ }
    try { diskSha = readFileSync(jsonPath + '.sha256', 'utf8').trim().split(/\s+/)[0]; } catch { /* missing */ }
    if (disk !== text) {
      let where = '(file missing)';
      if (disk != null) { try { where = firstDiff(JSON.parse(disk), json) || '(formatting)'; } catch { where = '(not JSON)'; } }
      err(`gen-claims --check: lib/claims.json is out of date with claims-allowlist.md — first difference at ${where}. Run: node content-engine/gen-claims.mjs`);
      return 1;
    }
    if (diskSha !== sha) { err(`gen-claims --check: lib/claims.json.sha256 (${diskSha}) != sha256(claims.json) (${sha})`); return 1; }
    log(`gen-claims --check: OK — ${json.approved.length} approved ids, ${json.rules.length} rule regexes, sha256 ${sha}`);
    return 0;
  }
  writeFileSync(jsonPath, text);
  writeFileSync(jsonPath + '.sha256', sha + '\n');
  log(`gen-claims: wrote lib/claims.json (${json.approved.length} approved ids, ${json.rules.length} rule regexes) sha256 ${sha}`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const a = process.argv.slice(2);
  if (a.some(x => !['--check'].includes(x))) { console.error('usage: node gen-claims.mjs [--check]'); process.exit(2); }
  process.exit(await run({ check: a.includes('--check') }));
}
