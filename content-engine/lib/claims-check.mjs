// lib/claims-check.mjs — one claims check for every channel (spec 29 §2).
// Pure library: Node stdlib only, no process.exit, no network, no clock.
//
//   loadPack({ jsonPath?, mdPath?, expectSha256? })           → Pack   (throws PackIntegrityError)
//   checkArtifact(input, { pack?, legacy?, skip? })            → ClaimsCheckResult (claims-check-result/1.0.0)
//   normalise(text)                                            → { text, map }
//   scanText(text, { channel, pack, html?, exempt? })          → hits[] (rule engine, CC01–CC04)
//
// The same input and pack always give the same bytes (no timestamps inside).
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { normalise as norm, canon, decodeEntities } from './normalise.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ENGINE = { name: 'claims-check', version: '1.0.0' };
export const CHANNELS = ['blog', 'page_meta', 'email', 'linkedin', 'meta', 'google_ads', 'social_generic'];
export const CHECK_IDS = ['CC01', 'CC02', 'CC03', 'CC04', 'CC05', 'CC06', 'CC07', 'CC08', 'CC09', 'CC10', 'CC11', 'CC12'];
const CONTENT_CHECKS = ['CC01', 'CC02', 'CC03', 'CC04'];

const sha256 = b => createHash('sha256').update(b).digest('hex');

export class PackIntegrityError extends Error {
  constructor(msg) { super(msg); this.name = 'PackIntegrityError'; }
}

// ─── pack ───────────────────────────────────────────────────────────────────
let MODULE_SHA = null;
function moduleSha() {
  if (MODULE_SHA) return MODULE_SHA;
  try { MODULE_SHA = sha256(readFileSync(fileURLToPath(import.meta.url))); } catch { MODULE_SHA = null; }
  return MODULE_SHA;
}

const packCache = new Map();
export function loadPack(opts = {}) {
  const jsonPath = opts.jsonPath || join(HERE, 'claims.json');
  const mdPath = opts.mdPath === undefined ? join(HERE, '..', 'claims-allowlist.md') : opts.mdPath;
  const key = `${jsonPath}|${mdPath}|${opts.expectSha256 || ''}`;
  if (packCache.has(key)) return packCache.get(key);
  const bytes = readFileSync(jsonPath);
  const sha = sha256(bytes);
  const shaFile = jsonPath + '.sha256';
  if (!existsSync(shaFile)) throw new PackIntegrityError(`missing ${shaFile}`);
  const recorded = readFileSync(shaFile, 'utf8').trim().split(/\s+/)[0];
  if (recorded !== sha) throw new PackIntegrityError(`claims.json sha256 ${sha} does not match claims.json.sha256 ${recorded} (regenerate: node content-engine/gen-claims.mjs)`);
  if (opts.expectSha256 && opts.expectSha256 !== sha) throw new PackIntegrityError(`pack sha256 ${sha} != expected ${opts.expectSha256}`);
  const data = JSON.parse(bytes.toString('utf8'));
  if (mdPath && existsSync(mdPath)) {
    const mdSha = sha256(readFileSync(mdPath));
    if (data.meta?.source_sha256 !== mdSha)
      throw new PackIntegrityError(`claims-allowlist.md changed (sha256 ${mdSha}) but claims.json was generated from ${data.meta?.source_sha256} (regenerate: node content-engine/gen-claims.mjs)`);
  }
  const pack = compilePack(data, sha);
  packCache.set(key, pack);
  return pack;
}

// Build the runtime pack from parsed claims.json data (also used by gen-claims.mjs
// for its self-consistency check before anything is written).
export function compilePack(data, sha = null) {
  const rules = (data.rules || []).map(r => ({ ...r, re: new RegExp(r.regex, 'g' + (r.flags || '').replace(/g/g, '')) }));
  const approved = new Map();
  for (const a of data.approved || []) {
    const syn = data.synonyms || {};
    const forms = new Set([canon(a.text, syn), ...(a.variants || []).map(v => canon(v, syn)), ...(a.short || []).map(v => canon(v, syn))]);
    const units = (a.units || [a.text]).map(u => canon(u, syn));
    approved.set(a.id, { ...a, channelSet: new Set(a.channels), forms, units });
  }
  return {
    id: data.meta?.pack_id || 'celeste-brand-pack', version: data.meta?.version || '0.0.0', sha256: sha,
    data, rules, approved, synonyms: data.synonyms || {},
    triggers: (data.claim_triggers || []).map(t => new RegExp(t, 'g')),
    internalNames: (data.internal_names || []).map(t => new RegExp(t, 'g')),
    hosts: data.hosts || { allowed: [], dead: [] }, channels: data.channels || {}, footers: data.footers || {},
  };
}

export function normalise(text, opts = {}) { return norm(text, opts); }

// ─── helpers ────────────────────────────────────────────────────────────────
export function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}
function lineText(text, index) {
  const s = text.lastIndexOf('\n', index - 1) + 1, e = text.indexOf('\n', index);
  return text.slice(s, e < 0 ? text.length : e);
}
const NEGATION = /\b(not|never|nothing|no)\b[a-z' ]{0,25}$/;
function jcs(v) {
  if (Array.isArray(v)) return '[' + v.map(jcs).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + jcs(v[k])).join(',') + '}';
  return JSON.stringify(v ?? null);
}
function isEditorial(raw, at) { return /data-editorial|<!--\s*editorial/i.test(lineText(raw, at)); }

// Normalise one field value the same way everywhere (rule scan, provenance spans, coverage).
// JSON fields (meta.json) are read as JSON string values; keys are skipped.
const JSON_PRE = '<script type="application/json">';
export function normField(raw, { html, json, synonyms } = {}) {
  if (!json) return norm(raw, { html, synonyms });
  const r = norm(JSON_PRE + raw + '</script>', { html: true, synonyms });
  return { text: r.text, map: r.map.map(i => Math.max(0, i - JSON_PRE.length)) };
}

// ─── rule engine (CC01–CC04) ────────────────────────────────────────────────
// Returns hits over ONE text. Each hit: {check, rule_id, family, severity, start, end, match, normalised, safe, why, negated}
// opts: channel, pack, html (bool|undefined = sniff), exempt(start,end,rule) → bool (CC03 call-only exemption)
export function scanText(raw, opts) {
  const pack = opts.pack;
  const channel = opts.channel;
  const { text: n, map } = opts.normed || normField(raw, { html: opts.html, json: opts.json === true, synonyms: pack.synonyms });
  const hits = [];
  for (const r of pack.rules) {
    const re = r.re; re.lastIndex = 0;
    let m;
    while ((m = re.exec(n)) !== null) {
      if (m[0] === '') { re.lastIndex++; continue; }
      const start = map[m.index], end = map[m.index + m[0].length - 1] + 1;
      if (r.domain_guard && n[m.index - 1] === '.') continue;                 // celeste7.ai, foo.ml
      if (r.check === 'CC03' && opts.exempt && opts.exempt(m.index, m.index + m[0].length, r, n)) continue;
      let severity = 'fail', negated = false;
      if (r.check !== 'CC03' && r.check !== 'CC04' && NEGATION.test(n.slice(Math.max(0, m.index - 40), m.index))) negated = true;
      if (channel === 'blog') {
        if (negated) severity = 'warn';
        if (r.editorial && isEditorial(raw, start)) severity = 'warn';
      }
      hits.push({ check: r.check, rule_id: r.id, family: r.family, severity, start, end, match: raw.slice(start, end), normalised: m[0], safe: r.safe || null, why: r.why || null, negated, regex: r.regex });
    }
  }
  // internal code / file names: case-sensitive, raw text (CC04)
  for (const re of pack.internalNames) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(raw)) !== null) {
      hits.push({ check: 'CC04', rule_id: 'INT', family: 'internal_name', severity: 'fail', start: m.index, end: m.index + m[0].length, match: m[0], normalised: m[0], safe: 'remove — internal names never appear in buyer copy', why: 'internal code/file name', negated: false, regex: re.source });
      if (m[0] === '') re.lastIndex++;
    }
  }
  // dead hosts on raw text too (URLs are dropped from normalised text) (CC04 / U15)
  for (const host of pack.hosts.dead || []) {
    const re = new RegExp(host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); let m;
    while ((m = re.exec(raw)) !== null) {
      const r = pack.rules.find(x => x.id === 'U15');
      hits.push({ check: 'CC04', rule_id: 'U15', family: r?.family || 'dead host', severity: 'fail', start: m.index, end: m.index + m[0].length, match: m[0], normalised: m[0].toLowerCase(), safe: r?.safe || null, why: r?.why || null, negated: false, regex: re.source });
    }
  }
  { const seen = new Set(); for (let k = hits.length - 1; k >= 0; k--) { const key = `${hits[k].rule_id}@${hits[k].start}`; if (seen.has(key)) hits.splice(k, 1); else seen.add(key); } }
  hits.sort((a, b) => a.start - b.start || (a.rule_id < b.rule_id ? -1 : a.rule_id > b.rule_id ? 1 : 0));
  return { hits, normalised: n, map };
}

// ─── approved-claim matching (CC05/CC06) ────────────────────────────────────
const STEM = w => w.replace(/(?:ing|ed|es|s)$/, '');
const stemmed = s => s.split(' ').map(STEM).join(' ');
function textMatches(a, claimText, syn) {
  const c = canon(claimText, syn);
  if (a.forms.has(c)) return true;
  // a run of consecutive units
  for (let i = 0; i < a.units.length; i++) {
    let acc = '';
    for (let j = i; j < a.units.length; j++) {
      acc = acc ? `${acc}. ${a.units[j]}` : a.units[j];
      if (canon(acc, syn) === c || canon(acc.replace(/\. /g, '; '), syn) === c) return true;
    }
  }
  const sc = stemmed(c);
  for (const f of a.forms) if (stemmed(f) === sc) return true;
  return false;
}

// ─── channel limits (CC07) ──────────────────────────────────────────────────
const plain = s => decodeEntities(String(s).replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
function glen(s) { let n = 0; for (const ch of plain(s)) n += /[　-鿿가-힯＀-￯]/.test(ch) ? 2 : 1; return n; }
function checkLimits(channel, fields, pack, input) {
  const spec = pack.channels[channel];
  const out = { limits: [], warns: [], unknown: [] };
  if (!spec) return out;
  const allowed = new Set([...(spec.fields || []), 'body', 'text']);
  for (const f of Object.keys(fields)) if (!allowed.has(f)) out.unknown.push(f);
  const L = spec.limits || {};
  for (const [f, lim] of Object.entries(L)) {
    if (!(f in fields)) continue;
    const vals = Array.isArray(fields[f]) ? fields[f] : [fields[f]];
    if (lim.count) { const [lo, hi] = lim.count; if (vals.length < lo || vals.length > hi) out.limits.push({ field: `/${f}`, count: [lo, hi], actual: vals.length }); }
    vals.forEach((v, i) => {
      const fld = Array.isArray(fields[f]) ? `/${f}/${i}` : `/${f}`;
      const len = f === 'hashtags' ? null : glen(v);
      if (lim.max != null && len != null && len > lim.max) out.limits.push({ field: fld, max: lim.max, actual: len });
      if (lim.min != null && len != null && len < lim.min) out.limits.push({ field: fld, min: lim.min, actual: len });
      if (lim.words_max != null && (!lim.when_basis || lim.when_basis === input.basis)) {
        const w = plain(v).split(/\s+/).filter(Boolean).length;
        if (w > lim.words_max) out.limits.push({ field: fld, words_max: lim.words_max, actual: w });
      }
      if (lim.no_exclamation && /!/.test(v)) out.limits.push({ field: fld, rule: 'no "!"' });
      if (lim.no_caps_word && /\b[A-Z]{4,}\b/.test(plain(v).replace(/\bCELESTEOS\b|\bUSD\b|\bAICPA\b|\bGDPR\b|\bSOC\b/g, ''))) out.limits.push({ field: fld, rule: 'no ALL-CAPS word' });
      if (lim.no_phone && /\+?\d[\d ()-]{7,}\d/.test(v)) out.limits.push({ field: fld, rule: 'no phone numbers' });
    });
    if (f === 'hashtags' && lim.max_items != null && vals.length > lim.max_items) out.limits.push({ field: '/hashtags', max: lim.max_items, actual: vals.length });
  }
  if (spec.equal_titles && channel === 'page_meta') {
    const t = ['title', 'og_title', 'twitter_title'].filter(k => fields[k]).map(k => plain(fields[k]));
    if (new Set(t).size > 1) out.warns.push('title / og_title / twitter_title differ');
    if (fields.og_url && fields.canonical && fields.og_url !== fields.canonical) out.limits.push({ field: '/og_url', rule: 'og_url must equal canonical' });
  }
  return out;
}

// ─── structure (CC08) — blog full pages, page_meta ─────────────────────────
function attrs(tag) {
  const o = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) o[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4];
  return o;
}
export function structure(html, { fullPage }) {
  const v = [];
  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  if (fullPage && h1 === 0) v.push({ detail: 'no <h1>', safe: 'a page needs exactly one <h1>' });
  if (h1 > 1) v.push({ detail: `${h1} <h1> elements`, safe: 'exactly one <h1> per page' });
  if (!fullPage) return v;
  const metas = [...html.matchAll(/<(meta|link)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)].map(m => ({ tag: m[1].toLowerCase(), a: attrs(m[0]) }));
  if (!metas.some(m => m.tag === 'link' && /(^|\s)canonical(\s|$)/i.test(m.a.rel || ''))) v.push({ detail: 'missing <link rel="canonical">', safe: 'add canonical URL' });
  const t = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (!t) v.push({ detail: 'missing <title>', safe: 'add a 30–65 char <title>' });
  else {
    const len = [...plain(t[1])].length;                                     // G9: rendered chars
    if (len < 30 || len > 65) v.push({ detail: `<title> is ${len} chars`, safe: '<title> must be 30–65 chars' });
  }
  const d = metas.find(m => m.tag === 'meta' && (m.a.name || '').toLowerCase() === 'description');
  if (!d || d.a.content == null) v.push({ detail: 'missing meta description', safe: 'add a meta description ≤155 chars' });
  else {
    const len = [...plain(d.a.content)].length;                              // G10: quote-aware attribute parse
    if (len > 155) v.push({ detail: `meta description is ${len} chars`, safe: 'meta description must be ≤155 chars' });
  }
  if (!/application\/ld\+json/i.test(html)) v.push({ detail: 'no JSON-LD', safe: 'add structured data (Article / FAQPage)' });
  else {
    const blocks = [...html.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
    if (blocks.length !== 1) v.push({ detail: `${blocks.length} JSON-LD blocks`, safe: 'exactly one ld+json block with one @graph' });
    else try {
      const ld = JSON.parse(blocks[0][1]);
      const nodes = ld['@graph'];
      if (!Array.isArray(nodes)) v.push({ detail: 'JSON-LD has no @graph', safe: 'wrap nodes in one @graph' });
      else {
        const SITE = new Set(['organization', 'website', 'logo', 'founder', 'software', 'pilot'].map(k => `https://celeste7.ai/#${k}`));
        const defined = new Set(), refs = [];
        (function walk(x) { if (x && typeof x === 'object') {
          if (x['@id']) (Object.keys(x).length === 1 ? refs.push(x['@id']) : defined.add(x['@id']));
          Object.values(x).forEach(walk); } })(nodes);
        for (const r of refs) if (!defined.has(r) && !SITE.has(r)) v.push({ detail: `unresolved @id ${r}`, safe: 'define it in the @graph' });
        if (nodes.filter(n => n['@type'] === 'BreadcrumbList').length > 1) v.push({ detail: 'duplicate BreadcrumbList', safe: 'one breadcrumb per page' });
      }
    } catch (e) { v.push({ detail: `JSON-LD does not parse: ${e.message}`, safe: 'fix the JSON' }); }
  }
  return v;
}

// data-pricing elements (site pricing section, FD2): an element marked data-pricing
// whose whole text is an approved commercial claim allowed on page_meta (L) exempts
// call-only hits inside it. Returns [{start,end}] in raw offsets.
function pricingSpans(raw, pack) {
  const spans = [];
  for (const m of raw.matchAll(/<([a-z][a-z0-9]*)\b(?:[^>"']|"[^"]*"|'[^']*')*\bdata-pricing\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    // find the matching close tag (nesting-aware for the same tag name)
    const tag = m[1].toLowerCase(), re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    re.lastIndex = m.index + m[0].length;
    let depth = 1, end = -1, t;
    while ((t = re.exec(raw))) { depth += t[1] ? -1 : 1; if (!depth) { end = t.index; break; } }
    if (end < 0) continue;
    const c = canon(decodeEntities(raw.slice(m.index + m[0].length, end).replace(/<[^>]+>/g, ' ')), pack.synonyms);
    const ok = [...pack.approved.values()].some(a => /^commercial\.C\d\d$/.test(a.id) && a.channelSet.has('page_meta') && (a.forms.has(c) || a.units.includes(c)));
    if (ok) spans.push({ start: m.index, end: end + tag.length + 3 });
  }
  return spans;
}

let ASSET_IDS = null;
function defaultAssetIds() {
  if (!ASSET_IDS) { try { ASSET_IDS = new Set(JSON.parse(readFileSync(join(HERE, 'assets.json'), 'utf8')).map(a => a.id)); } catch { ASSET_IDS = new Set(); } }
  return ASSET_IDS;
}

function exactCommercialSpans(nt, pack, channel) {
  const spans = [];
  for (const a of pack.approved.values()) {
    if (!/^commercial\.C\d\d$/.test(a.id) || !a.channelSet.has(channel)) continue;
    for (const form of new Set([...a.forms, ...a.units])) {
      let at = -1, from = 0;
      while (form && (at = nt.indexOf(form, from)) >= 0) { spans.push({ start: at, end: at + form.length }); from = at + 1; }
    }
  }
  return spans;
}

// ─── checkArtifact ──────────────────────────────────────────────────────────
// input: { channel, fields: {name: string|string[]}, claim_provenance?: {claims: []}, evidence?, links?, basis?, platform?, brand_pack? }
// opts:  { pack?, legacy?: boolean (blog CLI: CC05/CC06 not_applicable), skip?: string[] (check ids → not_applicable) }
export function checkArtifact(input, opts = {}) {
  const skip = new Set(opts.skip || []);
  const checks = Object.fromEntries(CHECK_IDS.map(id => [id, { id, result: 'pass', details: '' }]));
  const violations = [], claimsOut = [], unsupported = [], limitsOut = [];
  const set = (id, result, details) => {
    const order = { pass: 0, not_applicable: 0, warn: 1, insufficient_evidence: 2, fail: 3 };
    const cur = checks[id];
    if (order[result] > order[cur.result] || (cur.result === 'pass' && result === 'not_applicable')) checks[id] = { id, result, details };
    else if (result === cur.result && details && !cur.details.includes(details)) cur.details = cur.details ? `${cur.details}; ${details}` : details;
  };
  let pack = opts.pack, packErr = null;
  try { pack = pack || loadPack(); } catch (e) { packErr = e; }
  const channel = input?.channel;
  const brand_pack = pack ? { id: pack.id, version: pack.version, sha256: pack.sha256 } : null;
  const base = { schema: 'claims-check-result/1.0.0', brand_pack, engine: { ...ENGINE, web_sha: opts.web_sha || null, module_sha256: moduleSha() },
    channel: channel ?? null, input_sha256: sha256(jcs(input ?? null)) };

  if (packErr || !pack) {
    for (const id of CHECK_IDS) set(id, 'insufficient_evidence', id === 'CC12' ? `pack integrity: ${packErr?.message}` : 'pack unavailable');
    return finish();
  }
  if (input?.brand_pack && (input.brand_pack.sha256 !== pack.sha256 || input.brand_pack.id !== pack.id)) set('CC12', 'insufficient_evidence', `caller expects pack ${input.brand_pack.id}@${input.brand_pack.sha256}, engine has ${pack.id}@${pack.sha256}`);
  else set('CC12', 'pass', 'pack sha ok');
  if (!CHANNELS.includes(channel)) {
    for (const id of CHECK_IDS) if (id !== 'CC12') set(id, 'insufficient_evidence', `unknown channel ${JSON.stringify(channel)}`);
    return finish();
  }
  const fields = input.fields || {};
  const claims = input.claim_provenance?.claims || [];
  const syn = pack.synonyms;

  // CC05/CC06 — provenance per claim
  const covered = {};   // field → [{start,end, ref, okForK}] over normalised text
  const fieldNorm = {};
  for (const [f, v] of Object.entries(fields)) {
    const vals = Array.isArray(v) ? v : [v];
    fieldNorm[f] = vals.map(x => normField(String(x), { html: /html/.test(f) ? true : undefined, json: /json/.test(f), synonyms: syn }));
  }
  for (const c of claims) {
    const ref = c.support?.ref, type = c.support?.type;
    const field = String(c.location?.field || '').replace(/^\//, '').split('/')[0];
    let result = 'supported', details = '';
    const a = type === 'brand_pack' ? pack.approved.get(ref) : null;
    if (type === 'brand_pack') {
      if (!/^[a-z_]+\.(P|S|C|M)[0-9]{2}$/.test(ref || '') || !a) { result = 'unsupported'; details = `unknown approved id ${ref}`; }
      else if (!textMatches(a, c.text || '', syn)) { result = 'text_differs'; details = `text differs from ${ref}`; }
      else if (!a.channelSet.has(channel)) { result = 'wrong_channel'; details = `${ref} not approved for ${channel}`; }
    } else if (type === 'evidence') {
      const ev = (input.evidence || []).find(e => e.id === ref);
      if (!ev) { result = 'unsupported'; details = `evidence ${ref} not in input.evidence[]`; }
      else if (!['feed', 'ledger_query', 'repo_file', 'public_url'].includes(ev.source_type)) { result = 'unsupported'; details = `evidence ${ref} source_type ${ev.source_type}`; }
      else if (!['numeric', 'factual'].includes(c.kind)) { result = 'unsupported'; details = `kind ${c.kind} must cite the brand pack`; }
      else if (c.kind === 'numeric' && ev.value != null && !canon(c.text || '', syn).includes(canon(String(ev.value), syn))) { result = 'unsupported'; details = `value ${ev.value} not in claim text`; }
    } else { result = 'unsupported'; details = `support.type=${type ?? 'none'}`; }
    claimsOut.push({ claim_id: c.claim_id ?? null, support_ref: ref ?? null, result, details });
    if (result === 'wrong_channel') { if (!skip.has('CC06')) set('CC06', 'fail', details); }
    else if (result !== 'supported') { if (!skip.has('CC05')) set('CC05', 'fail', `${c.claim_id ?? '?'} ${result}`); }
    // record the covered span in normalised text (for CC03 exemption + coverage)
    const ct = norm(String(c.text || ''), { synonyms: syn, html: false }).text.replace(/[.!?;:, ]+$/, '');
    for (const [f, arr] of Object.entries(fieldNorm)) {
      if (field && field !== f) continue;
      arr.forEach(({ text: nt }, idx) => {
        let at = -1, from = 0;
        while (ct && (at = nt.indexOf(ct, from)) >= 0) {
          (covered[`${f}#${idx}`] ??= []).push({ start: at, end: at + ct.length, ref, result, isC: !!a && /^commercial\.C\d\d$/.test(ref) });
          from = at + 1;
        }
      });
    }
  }
  if (!claims.length) set('CC06', 'not_applicable', 'no claims');

  // CC01–CC04 — rule engine per field
  const kExemptBasis = !(channel === 'email' && input.basis === 'promotional');
  for (const [f, v] of Object.entries(fields)) {
    const vals = Array.isArray(v) ? v : [v];
    vals.forEach((raw, idx) => {
      raw = String(raw);
      const cov = covered[`${f}#${idx}`] || [];
      const html = /html/.test(f) ? true : undefined;
      const fullPage = /<html[\s>]|<head[\s>]/i.test(raw);
      const priceSpans = fullPage || /data-pricing/.test(raw) ? pricingSpans(raw, pack) : [];
      // llms.txt (page_meta, plain text): an approved commercial.C* line allowed on page_meta, used verbatim, is its own provenance
      const llmsSpans = channel === 'page_meta' && f === 'llms_txt' ? exactCommercialSpans(fieldNorm[f][idx].text, pack, channel) : [];
      const { hits } = scanText(raw, { channel, pack, html, json: /json/.test(f), normed: fieldNorm[f][idx],
        exempt: (s, e, r) => (kExemptBasis && cov.some(c => c.isC && c.result === 'supported' && s >= c.start && e <= c.end)) || llmsSpans.some(c => s >= c.start && e <= c.end) });
      for (const h of hits) {
        if (h.check === 'CC03' && priceSpans.some(p => h.start >= p.start && h.end <= p.end) && (channel === 'page_meta' || channel === 'blog')) continue;
        const fld = Array.isArray(v) ? `/${f}/${idx}` : `/${f}`;
        violations.push({ id: h.check, rule_id: h.rule_id, severity: h.severity, field: fld, line: lineOf(raw, h.start), start: h.start, end: h.end,
          match: h.match.slice(0, 120), normalised: h.normalised, safe: h.safe, ...(h.negated ? { negated: true } : {}) });
        if (!skip.has(h.check)) set(h.check, h.severity, `${h.rule_id}${h.negated ? ' (negated)' : ''}`);
      }
      // dead hosts in links + allowed link hosts handled under CC10

      // coverage (CC05): triggered sentences outside provenance spans
      if (!opts.legacy && !skip.has('CC05') && input.claim_provenance) {
        const nt = fieldNorm[f][idx].text;
        const masked = cov.reduce((s, c) => s.slice(0, c.start) + ' '.repeat(c.end - c.start) + s.slice(c.end), nt);
        for (const m of masked.matchAll(/[^.!?;\n]+[.!?;]?/g)) {
          const sent = m[0].trim();
          if (!sent || sent.length < 3) continue;
          if (pack.triggers.some(t => { t.lastIndex = 0; return t.test(sent); })) {
            unsupported.push({ field: Array.isArray(v) ? `/${f}/${idx}` : `/${f}`, start: m.index, end: m.index + m[0].length, text: sent.slice(0, 160) });
          }
        }
      }
      // structure (CC08) / assets (CC09) for blog
      if (channel === 'blog' && !skip.has('CC08') && !/json/.test(f)) {
        for (const s of structure(raw, { fullPage })) {
          set('CC08', 'fail', s.detail);
          violations.push({ id: 'CC08', rule_id: 'STRUCT', severity: 'fail', field: `/${f}`, line: 1, start: 0, end: 0, match: s.detail, normalised: '', safe: s.safe });
        }
      }
      if (channel === 'blog' && !skip.has('CC09')) {
        const ids = opts.assetIds ? new Set(opts.assetIds) : defaultAssetIds();
        for (const m of raw.matchAll(/\{\{\s*asset:\s*([a-z0-9-]+)\s*\}\}/gi)) {
          if (!ids.has(m[1])) {
            set('CC09', 'fail', `unknown asset ${m[1]}`);
            violations.push({ id: 'CC09', rule_id: 'ASSET', severity: 'fail', field: `/${f}`, line: lineOf(raw, m.index), start: m.index, end: m.index + m[0].length, match: m[0], normalised: m[0], safe: `unknown asset id "${m[1]}" — must exist in lib/assets.json` });
          }
        }
      }
    });
  }
  if (!opts.legacy && !skip.has('CC05')) {
    if (!input.claim_provenance) set('CC05', 'insufficient_evidence', 'no claim_provenance');
    else if (unsupported.length) set('CC05', channel === 'blog' ? 'warn' : 'fail', `${unsupported.length} uncovered claim-bearing sentence(s)`);
  }
  if (opts.legacy) { set('CC05', 'not_applicable', 'legacy blog CLI'); set('CC06', 'not_applicable', 'legacy blog CLI'); }

  // CC07 — channel limits / unknown fields
  const lim = checkLimits(channel, fields, pack, input);
  for (const u of lim.unknown) set('CC07', 'fail', `unknown field /${u}`);
  for (const l of lim.limits) { limitsOut.push(l); set('CC07', 'fail', `${l.field} ${l.max != null ? `${l.actual} > ${l.max}` : l.min != null ? `${l.actual} < ${l.min}` : l.words_max != null ? `${l.actual} words > ${l.words_max}` : l.count ? `count ${l.actual} not in ${l.count.join('-')}` : l.rule}`); }
  for (const w of lim.warns) set('CC07', 'warn', w);
  if (channel !== 'blog' && channel !== 'page_meta') set('CC08', 'not_applicable', 'structure: blog/page_meta only');
  if (channel !== 'blog') set('CC09', 'not_applicable', 'assets: blog only');

  // CC10 — links: allowed host, UTM, no Bookings landing
  const needsUtm = ['email', 'linkedin', 'meta', 'google_ads', 'social_generic'].includes(channel);
  const links = [...(input.links || []), ...(fields.final_url ? [].concat(fields.final_url) : []), ...(fields.link ? [].concat(fields.link) : [])];
  if (!needsUtm) set('CC10', 'not_applicable', 'links: outbound channels only');
  else if (!links.length) set('CC10', 'not_applicable', 'no links');
  else for (const l of links) {
    let u; try { u = new URL(l); } catch { set('CC10', 'fail', `bad URL ${l}`); continue; }
    const host = u.hostname.toLowerCase();
    if ((pack.hosts.dead || []).includes(host)) set('CC10', 'fail', `dead host ${host}`);
    else if (!(pack.hosts.allowed || []).includes(host)) set('CC10', 'fail', `host ${host} not allowed`);
    if (/bookings|book\.ms|teams\.microsoft\.com/i.test(l)) set('CC10', 'fail', 'Bookings URL as landing page');
    for (const p of ['utm_source', 'utm_medium', 'utm_campaign']) if (!u.searchParams.get(p)) set('CC10', 'fail', `${p} missing on ${host}`);
    for (const [k, val] of u.searchParams) if (/^utm_/.test(k) && (/@/.test(val) || /[A-Z\s]/.test(val))) set('CC10', 'fail', `${k} must be lowercase, no spaces, no emails`);
  }

  // CC11 — email footer per basis
  if (channel !== 'email') set('CC11', 'not_applicable', 'footer: email only');
  else {
    const f = pack.footers[input.basis];
    if (!f) set('CC11', 'insufficient_evidence', `basis ${JSON.stringify(input.basis)} unknown`);
    else {
      const body = plain([].concat(fields.body || '').join('\n')).toLowerCase();
      for (const req of f.require || []) if (!new RegExp(req, 'i').test(body)) set('CC11', 'fail', `${input.basis} footer missing /${req}/`);
    }
  }
  return finish();

  function finish() {
    for (const id of skip) if (checks[id] && (checks[id].result === 'pass' || checks[id].result === 'not_applicable')) checks[id] = { id, result: 'not_applicable', details: 'skipped by caller' };
    for (const id of CONTENT_CHECKS) if (checks[id].result === 'pass' && !checks[id].details) checks[id].details = '0 hits';
    const list = CHECK_IDS.map(id => checks[id]);
    const verdict = list.some(c => c.result === 'fail') ? 'fail' : list.some(c => c.result === 'insufficient_evidence') ? 'insufficient_evidence' : list.some(c => c.result === 'warn') ? 'warn' : 'pass';
    return { ...base, verdict, checks: list, violations, claims: claimsOut, unsupported_sentences: unsupported, limits: limitsOut };
  }
}

// Exit code for a result (CLI contract, spec §2.6): 0 pass|warn · 1 fail · 3 insufficient_evidence
export function exitCodeFor(res) { return res.verdict === 'fail' ? 1 : res.verdict === 'insufficient_evidence' ? 3 : 0; }

// Blind/corpus scoring helper: verdict over the content checks only (CC01–CC04),
// so length/format/provenance never decide whether a phrasing is "blocked".
export function contentVerdict(res) {
  const cs = res.checks.filter(c => CONTENT_CHECKS.includes(c.id));
  if (cs.some(c => c.result === 'insufficient_evidence') && !cs.some(c => c.result === 'fail')) return 'insufficient_evidence';
  return cs.some(c => c.result === 'fail') ? 'fail' : cs.some(c => c.result === 'warn') ? 'warn' : 'pass';
}
