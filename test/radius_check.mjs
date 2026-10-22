// Fails on any border-radius value above 4px in landing-v12.css and js/cookie-consent.js,
// except 50% / 100% / 9999px (round things) and the founder photo mask. No dependencies.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWED_SELECTORS = [/\.fn-photo/]; // image mask, deliberately left (listed in the PR)
const bad = [];
for (const f of ['landing-v12.css', 'js/cookie-consent.js']) {
  const src = readFileSync(join(root, f), 'utf8');
  for (const m of src.matchAll(/border-radius\s*:\s*([^;}'"]*)/g)) {
    const v = m[1].trim();
    if (/^(50%|100%|inherit|0)$/.test(v)) continue;
    const px = [...v.matchAll(/([\d.]+)\s*(px|rem|em)/g)].map((x) => parseFloat(x[1]) * (x[2] === 'px' ? 1 : 16));
    if (!px.length || px.every((p) => p <= 4 || p >= 9999)) continue;
    const open = src.lastIndexOf('{', m.index);
    const sel = src.slice(Math.max(src.lastIndexOf('}', open), 0) + 1, open).trim();
    if (ALLOWED_SELECTORS.some((r) => r.test(sel))) continue;
    bad.push(`${f}:${src.slice(0, m.index).split('\n').length} border-radius: ${v}  [${sel.replace(/\s+/g, ' ').slice(0, 50)}]`);
  }
}
if (bad.length) { console.error(`radius_check FAIL: ${bad.length} value(s) above 4px`); bad.forEach((b) => console.error('  ' + b)); process.exit(1); }
console.log('radius_check PASS');
