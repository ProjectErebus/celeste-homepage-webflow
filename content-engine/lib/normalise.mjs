// lib/normalise.mjs — pure text normaliser for the claims check (spec 29 §2.3).
// Node stdlib only. No IO, no process.exit.
//
//   normalise(text, { html?: boolean, synonyms?: Record<string,string> })
//     → { text: string, map: Int32Array }
//
// `map[i]` is the offset in the ORIGINAL input of normalised character i, so a
// violation found in normalised text reports the original line and columns.
// The steps run in a fixed order (spec §2.3 steps 1–10):
//   1  HTML: <style> dropped; <script> reduced to its string literals (JSON-LD and
//      inline-JS copy is still copy); comments dropped; block tags → newline;
//      content/alt/title/aria-label/placeholder attribute values kept as text;
//      every other tag removed
//   2  entities decoded (named + numeric)
//   3  NFKC; soft hyphen and zero-width characters removed
//   4  curly quotes → ' and "; U+2010–2015 and U+2212 → -
//   5  lowercase; whitespace runs collapse to one space
//   6  "a. i." → ai; hyphen between letters (or letter/digit) → space
//   7  currency symbols/codes → ¤
//   8  numbers: 20,000 → 20000; twenty thousand → 20000; one–fifty → digits; 20k → 20000;
//      ranges → "A to B"; 24/7 forms; "30, 14 and 7" → 30/14/7; "N plus" → N+
//   9  synonyms (data, longest first, word-bounded)
//  10  (the .ai/.ml domain guard is applied by the rule engine, not here)

const ENT = {
  amp: '&', nbsp: ' ', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  sbquo: '‚', bdquo: '„', mdash: '—', ndash: '–', minus: '−', middot: '·', bull: '•', hellip: '…', shy: '­',
  zwj: '‍', zwnj: '‌', thinsp: ' ', ensp: ' ', emsp: ' ', hairsp: ' ', copy: '©', reg: '®', trade: '™',
  euro: '€', pound: '£', dollar: '$', cent: '¢', yen: '¥', times: '×', divide: '÷', deg: '°', rarr: '→', larr: '←',
  harr: '↔', uarr: '↑', darr: '↓', check: '✓', laquo: '«', raquo: '»', prime: '′', Prime: '″', sect: '§', para: '¶',
  frac12: '½', frac14: '¼', frac34: '¾', plusmn: '±', le: '≤', ge: '≥', ne: '≠', asymp: '≈', infin: '∞', num: '#',
  percnt: '%', commat: '@', colon: ':', semi: ';', comma: ',', period: '.', excl: '!', quest: '?', lpar: '(', rpar: ')',
  sol: '/', bsol: '\\', ast: '*', plus: '+', equals: '=', hyphen: '‐', dash: '‐', lowbar: '_', verbar: '|',
  eacute: 'é', egrave: 'è', ecirc: 'ê', aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', ouml: 'ö', uuml: 'ü',
  oacute: 'ó', iacute: 'í', uacute: 'ú', ntilde: 'ñ', ccedil: 'ç', szlig: 'ß', aring: 'å', oslash: 'ø', aelig: 'æ',
};
export function decodeEntities(s) {
  return s.replace(/&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return cp > 0 && cp < 0x110000 ? String.fromCodePoint(cp) : m;
    }
    return ENT[e] ?? ENT[e.toLowerCase()] ?? m;
  });
}

const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50 };
const NUMW_RE = Object.keys(NUMW).sort((a, b) => b.length - a.length).join('|');

// One mapped replace pass. `fn(match, ...groups)` returns the replacement: a string, or
// an array of pieces [text, relOffset] where relOffset is the piece's position inside the
// match (so kept attribute values and script strings map back to their exact columns).
// A plain-string replacement maps char j to match char min(j, len-1).
function sub(st, re, fn) {
  if (!re.global) throw new Error('sub() needs a global regex');
  let out = '', last = 0;
  const map = [];
  const at = (i, rel, len) => st.map[i + Math.min(rel, Math.max(0, len - 1))] ?? st.map[st.map.length - 1] ?? 0;
  for (const m of st.s.matchAll(re)) {
    const i = m.index, len = m[0].length;
    out += st.s.slice(last, i);
    for (let k = last; k < i; k++) map.push(st.map[k]);
    const r = fn(...m);
    const pieces = typeof r === 'string' ? [[r, 0, true]] : r;
    for (const [text, rel, spread] of pieces) {
      out += text;
      for (let j = 0; j < text.length; j++) map.push(at(i, spread ? j : rel + j, spread ? len : len));
    }
    last = i + len;
  }
  out += st.s.slice(last);
  for (let k = last; k < st.s.length; k++) map.push(st.map[k]);
  st.s = out; st.map = map;
  return st;
}

const KEEP_ATTRS = /\s(?:content|alt|title|aria-label|placeholder)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const BLOCK = /^(?:p|br|li|ul|ol|h[1-6]|div|td|th|tr|table|section|article|header|footer|nav|main|aside|blockquote|figure|figcaption|dt|dd|dl|button|label|option|title|summary|details|hr|pre)$/i;

// JS/JSON string literal contents as mapped pieces (one per line). JSON object keys are skipped.
function scriptPieces(body, bodyRel, isJson) {
  const out = [['\n', 0]];
  const re = isJson ? /"((?:[^"\\\n]|\\.)*)"(\s*:)?/g : /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
  let m;
  while ((m = re.exec(body))) {
    if (isJson && m[2]) continue;                       // a key
    const rawV = m[1] ?? m[2] ?? m[3] ?? '';
    let v = rawV;
    if (/\\/.test(v)) { try { v = JSON.parse('"' + v.replace(/\\'/g, "'").replace(/\\`/g, '`').replace(/\n/g, '\\n') + '"'); } catch { /* keep raw */ } }
    if (/[a-z]{2,}[^\n]*\s[a-z]/i.test(v) || /[$€£]\s?\d/.test(v)) out.push([v, bodyRel + m.index + 1], ['\n', bodyRel + m.index]);
  }
  return out;
}

export function normalise(input, opts = {}) {
  const html = opts.html ?? /<[a-z!\/][^>]*>/i.test(input);
  const st = { s: String(input), map: Array.from({ length: String(input).length }, (_, i) => i) };

  // 1. HTML
  if (html) {
    sub(st, /<!--[\s\S]*?-->/g, () => '\n');
    sub(st, /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, () => '\n');
    sub(st, /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (m, attrs, body) => {
      if (/\bsrc\s*=/.test(attrs)) return '\n';
      const isJson = /application\/(ld\+)?json/i.test(attrs);
      if (!isJson && /type\s*=\s*["']?(?!text\/javascript|module|application\/javascript)/i.test(attrs)) return '\n';
      return scriptPieces(body, m.indexOf('>') + 1, isJson);
    });
    sub(st, /<\/?([a-z][a-z0-9-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi, (m, tag, attrs) => {
      const pieces = [];
      const base = 1 + (m[1] === '/' ? 1 : 0) + tag.length;
      for (const a of (attrs || '').matchAll(KEEP_ATTRS)) {
        const v = a[1] ?? a[2];
        pieces.push(['\n', base + a.index], [v, base + a.index + a[0].length - 1 - v.length], ['\n', base + a.index + a[0].length - 1]);
      }
      const nl = BLOCK.test(tag) ? '\n' : '';
      return pieces.length ? pieces : nl;
    });
  }
  // URLs are addresses, not copy (dead hosts are caught on raw text by the engine)
  sub(st, /\b(?:https?:\/\/|www\.)[^\s"'<>]+/gi, () => ' ');
  // 2. entities
  sub(st, /&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi, m => decodeEntities(m));
  // 3. NFKC per character (keeps the map aligned); soft hyphen / zero-width removed
  sub(st, /[^\x00-\x7f]/g, ch => ch.normalize('NFKC'));
  sub(st, /[­​-‍⁠﻿]/g, () => '');
  // 4. quotes and dashes
  sub(st, /[‘’ʼ‚′`´]/g, () => "'");
  sub(st, /[“”„″«»]/g, () => '"');
  sub(st, /[‐-―−]/g, () => '-');
  // 5. lowercase (per char, so the map stays aligned) + whitespace
  sub(st, /[A-ZÀ-￿]/g, ch => { const l = ch.toLowerCase(); return l.length === 1 ? l : ch; });
  sub(st, /\s+/g, () => ' ');
  // 6. spacing variants
  sub(st, /\ba\. ?i\.(?=\s|$)/g, () => 'ai');
  sub(st, /([a-z0-9])-(?=[a-z])|(?<=[a-z]{2})-(?=[0-9])/g, (m, a) => (a || '') + ' ');   // auto-generated, soc-2, 30-minute (not single-letter IDs like r-2024)
  // 7. currency
  sub(st, /\b(?:us\$|usd|eur|gbp)\s?(?=\d)|[$€£]\s?/g, () => [[' ', 0], ['¤', 0], [' ', 0]]);
  // 8. numbers
  sub(st, /\b(\d{1,3})((?:,\d{3})+|(?: \d{3})+)\b/g, (m, a, b) => a + b.replace(/[ ,]/g, ''));
  sub(st, new RegExp(`\\b(${NUMW_RE}|hundred) thousand\\b`, 'g'), (m, w) => String((w === 'hundred' ? 100 : NUMW[w]) * 1000));
  sub(st, new RegExp(`\\b(${NUMW_RE})\\b`, 'g'), w => String(NUMW[w]));
  sub(st, /\b(\d+(?:\.\d+)?)\s?k\b/g, (m, n) => String(Math.round(parseFloat(n) * 1000)));
  sub(st, /(?<![\w.\/-])(\d+(?:\.\d+)?)\s*(?:-|to)\s*(?:¤\s*)?(\d+(?:\.\d+)?)(?![\w\/-])/g, (m, a, b) => `${a} to ${b}`);   // ranges; not IDs/dates (R-2024-0147, 2026-10-31)
  sub(st, /\b24\s*(?:\/|x| to )\s*7\b/g, () => '24/7');
  sub(st, /\b(\d+)\s*[\/,]\s*(\d+)\s*(?:[\/,]|,? and)\s*(\d+)\b/g, (m, a, b, c) => `${a}/${b}/${c}`);
  sub(st, /(\d) plus\b/g, (m, a) => `${a}+`);
  // 9. synonyms (longest first, word-bounded)
  const syn = opts.synonyms || {};
  for (const from of Object.keys(syn).sort((a, b) => b.length - a.length || (a < b ? -1 : 1))) {
    const esc = from.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sub(st, new RegExp(`(?<![a-z0-9])${esc}(?![a-z0-9])`, 'g'), () => syn[from]);
  }
  sub(st, / {2,}/g, () => ' ');
  // trim
  const lead = st.s.length - st.s.trimStart().length, trail = st.s.length - st.s.trimEnd().length;
  st.s = st.s.slice(lead, st.s.length - trail); st.map = st.map.slice(lead, st.map.length - trail);
  return { text: st.s, map: Int32Array.from(st.map) };
}

// Normalised comparison form for approved-text matching: normalise, then drop
// terminal punctuation and quotes.
export function canon(s, synonyms) {
  return normalise(s, { html: false, synonyms }).text.replace(/^["' ]+|["'.!?;:, ]+$/g, '');
}
